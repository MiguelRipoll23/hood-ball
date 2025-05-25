import { WEBSOCKET_ENDPOINT } from "../constants/api-constants.js";
import { GameController } from "../models/game-controller.js";
import { EventProcessorService } from "./event-processor-service.js";
import { LocalEvent } from "../models/local-event.js";
import { EventType } from "../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../interfaces/event/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../interfaces/event/server-notification-payload.js";
import { WebSocketType } from "../enums/websocket-type.js";
import { TunnelType } from "../enums/tunnel-type.js";
import { APIUtils } from "../utils/api-utils.js";
import type { GameState } from "../models/game-state.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";

export class WebSocketService {
  private gameState: GameState;
  private eventProcessorService: EventProcessorService;
  private baseURL: string;
  private webSocket: WebSocket | null = null;

  constructor(private gameController: GameController) {
    this.gameState = gameController.getGameState();
    this.eventProcessorService = gameController.getEventProcessorService();
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

  public sendMessage(payload: ArrayBuffer): void {
    if (
      this.webSocket === null ||
      this.webSocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    try {
      this.webSocket.send(payload);
      console.debug(`Sent message to server`, payload);
    } catch (error) {
      console.error(`Failed to send message to server`, error);
    }
  }

  private addEventListeners(webSocket: WebSocket): void {
    webSocket.addEventListener("open", this.handleOpenEvent.bind(this));
    webSocket.addEventListener("close", this.handleCloseEvent.bind(this));
    webSocket.addEventListener("error", this.handleErrorEvent.bind(this));
    webSocket.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleOpenEvent(): void {
    console.log("Connected to server");
    this.gameState.getGameServer().setConnected(true);
    this.gameController
      .getEventProcessorService()
      .addLocalEvent(new LocalEvent(EventType.ServerConnected, null));
  }

  private handleCloseEvent(event: CloseEvent): void {
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

  private handleErrorEvent(event: Event): void {
    console.error("WebSocket error", event);
  }

  private handleMessage(event: MessageEvent) {
    const data: ArrayBuffer = event.data;
    console.debug("Received message from server", new Uint8Array(data));

    const dataView = new DataView(data);
    const typeId = dataView.getUint8(0);
    const payload = data.byteLength > 1 ? data.slice(1) : null;

    switch (typeId) {
      case WebSocketType.Notification:
        return this.handleNotificationMessage(payload);

      case WebSocketType.PlayerIdentity:
        return this.gameController
          .getMatchmakingService()
          .handlePlayerIdentity(payload);

      case WebSocketType.Tunnel:
        return this.handleTunnelMessage(payload);

      default: {
        console.warn("Unknown websocket message identifier", typeId);
      }
    }
  }

  private handleNotificationMessage(payload: ArrayBuffer | null) {
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

  private handleTunnelMessage(payload: ArrayBuffer | null): void {
    if (payload === null || payload.byteLength < 33) {
      console.warn("Invalid tunnel message length");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(payload);

    const originTokenBytes = binaryReader.bytes(32);
    const tunnelTypeId = binaryReader.unsignedInt8();
    const tunnelData = binaryReader.bytesAsArrayBuffer();

    const originToken = btoa(String.fromCharCode(...originTokenBytes));

    switch (tunnelTypeId) {
      case TunnelType.IceCandidate:
        return this.handleNewIceCandidateMessage(originToken, tunnelData);

      case TunnelType.SessionDescription:
        return this.handleSessionDescriptionMessage(originToken, tunnelData);

      default:
        console.warn("Unknown tunnel type id", tunnelTypeId);
    }
  }

  private handleNewIceCandidateMessage(
    originToken: string,
    payload: ArrayBuffer
  ): void {
    let iceCandidateData;

    try {
      iceCandidateData = JSON.parse(new TextDecoder().decode(payload));
    } catch (error) {
      console.error("Failed to parse ICE candidate data", error);
      return;
    }

    this.gameController
      .getWebRTCService()
      .handleNewIceCandidate(originToken, iceCandidateData);
  }

  private handleSessionDescriptionMessage(
    originToken: string,
    payload: ArrayBuffer
  ): void {
    let sessionDescriptionData;

    try {
      sessionDescriptionData = JSON.parse(new TextDecoder().decode(payload));
    } catch (error) {
      console.error("Failed to parse session description data", error);
      return;
    }

    this.gameController
      .getWebRTCService()
      .handleSessionDescriptionEvent(originToken, sessionDescriptionData);
  }
}
