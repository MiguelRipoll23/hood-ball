import { WEBSOCKET_ENDPOINT } from "../constants/api-constants.js";
import { GameState } from "../models/game-state.js";
import { GameController } from "../models/game-controller.js";
import { WebRTCService } from "./webrtc-service.js";
import { EventProcessorService } from "./event-processor-service.js";
import { LocalEvent } from "../models/local-event.js";
import { EventType } from "../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../interfaces/event/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../interfaces/event/server-notification-payload.js";
import { WebSocketType } from "../enums/websocket-type.js";
import { TunnelType } from "../enums/tunnel-type.js";
import { APIUtils } from "../utils/api-utils.js";

export class WebSocketService {
  private gameState: GameState;
  private eventProcessorService: EventProcessorService;
  private webrtcService: WebRTCService;

  private baseURL: string;
  private webSocket: WebSocket | null = null;

  constructor(gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.eventProcessorService = gameController.getEventProcessorService();
    this.webrtcService = gameController.getWebRTCService();
    this.baseURL = APIUtils.getWSBaseURL();
  }

  public connectToServer(): void {
    const gameServer = this.gameState.getGameServer();
    const serverRegistration = gameServer.getServerRegistration();

    if (serverRegistration === null) {
      throw new Error("Game registration not found");
    }

    const authenticationToken = serverRegistration.getAuthenticationToken();

    this.webSocket = new WebSocket(
      this.baseURL + WEBSOCKET_ENDPOINT + `?access_token=${authenticationToken}`
    );

    this.webSocket.binaryType = "arraybuffer";
    this.addEventListeners(this.webSocket);
  }

  public sendTunnelMessage(payload: Uint8Array) {
    const message = new Uint8Array([WebSocketType.Tunnel, ...payload]);
    this.webSocket?.send(message);

    console.log("Sent tunnel message:", message);
  }

  private addEventListeners(webSocket: WebSocket): void {
    webSocket.addEventListener("open", () => {
      this.handleConnection();
    });

    webSocket.addEventListener("close", (event) => {
      this.handleDisconnection(event);
    });

    webSocket.addEventListener("error", (event) => {
      console.error("WebSocket error", event);
    });

    webSocket.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });
  }

  private handleConnection(): void {
    console.log("Connected to server");
    this.gameState.getGameServer().setConnected(true);
    this.eventProcessorService.addLocalEvent(
      new LocalEvent(EventType.ServerConnected, null)
    );
  }

  private handleDisconnection(event: CloseEvent): void {
    console.log("Connection closed", event);

    const payload = {
      connectionLost: this.gameState.getGameServer().isConnected(),
    };

    const localEvent = new LocalEvent<ServerDisconnectedPayload>(
      EventType.ServerDisconnected,
      payload
    );

    this.eventProcessorService.addLocalEvent(localEvent);
    this.gameState.getGameServer().setConnected(false);
  }

  private handleMessage(data: ArrayBuffer) {
    console.log("Received message from server", new Uint8Array(data));

    const dataView = new DataView(data);
    const id = dataView.getUint8(0);
    const payload = data.byteLength > 1 ? data.slice(1) : null;

    switch (id) {
      case WebSocketType.Notification:
        return this.handleNotification(payload);

      case WebSocketType.Tunnel:
        return this.handleTunnelMessage(payload);

      default: {
        console.warn("Unknown websocket message identifier", id);
      }
    }
  }

  private handleNotification(payload: ArrayBuffer | null) {
    if (payload === null) {
      return console.warn("Received empty notification");
    }

    const message = new TextDecoder("utf-8").decode(payload);
    const localEvent = new LocalEvent<ServerNotificationPayload>(
      EventType.ServerNotification,
      { message }
    );

    this.eventProcessorService.addLocalEvent(localEvent);
  }

  private handleTunnelMessage(payload: ArrayBuffer | null) {
    if (payload === null) {
      return console.warn("Received empty tunnel message");
    } else if (payload.byteLength < 33) {
      return console.warn("Invalid tunnel message length", payload);
    }

    const dataView = new DataView(payload);
    const originTokenBytes = new Uint8Array(payload.slice(0, 32));
    const webrtcType = dataView.getUint8(32);
    const webrtcDataBytes = payload.slice(33);

    const originToken = btoa(String.fromCharCode(...originTokenBytes));

    const webrtcData = JSON.parse(
      new TextDecoder("utf-8").decode(webrtcDataBytes)
    );

    console.log("Tunnel message", originToken, webrtcType, webrtcData);

    this.handleWebRTCMessage(originToken, webrtcType as TunnelType, webrtcData);
  }

  private handleWebRTCMessage(
    originToken: string,
    type: TunnelType,
    webrtcPayload: RTCIceCandidate | RTCSessionDescriptionInit
  ) {
    switch (type) {
      case TunnelType.IceCandidate:
        return this.webrtcService.handleNewIceCandidate(
          originToken,
          webrtcPayload as RTCIceCandidateInit
        );

      case TunnelType.SessionDescription:
        return this.webrtcService.handleSessionDescriptionEvent(
          originToken,
          webrtcPayload as RTCSessionDescriptionInit
        );

      default: {
        console.warn("Unknown tunnel message type", type);
      }
    }
  }
}
