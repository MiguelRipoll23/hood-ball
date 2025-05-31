import { WEBSOCKET_ENDPOINT } from "../constants/api-constants.js";
import { GameController } from "../models/game-controller.js";
import { EventProcessorService } from "./event-processor-service.js";
import { LocalEvent } from "../models/local-event.js";
import { EventType } from "../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../interfaces/events/server-notification-payload.js";
import { WebSocketType } from "../enums/websocket-type.js";
import { APIUtils } from "../utils/api-utils.js";
import type { GameState } from "../models/game-state.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";

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

  public sendMessage(arrayBuffer: ArrayBuffer): void {
    if (
      this.webSocket === null ||
      this.webSocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    try {
      this.webSocket.send(arrayBuffer);

      if (this.gameController.getDebugSettings().isWebSocketLoggingEnabled()) {
        console.debug(
          "%cSent message to server:\n" + BinaryWriter.preview(arrayBuffer),
          "color: purple"
        );
      }
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
      .addLocalEvent(new LocalEvent(EventType.ServerConnected));
  }

  private handleCloseEvent(event: CloseEvent): void {
    console.log("Connection closed", event);

    const payload = {
      connectionLost: this.gameState.getGameServer().isConnected(),
    };

    const localEvent = new LocalEvent<ServerDisconnectedPayload>(
      EventType.ServerDisconnected
    );

    localEvent.setData(payload);

    this.eventProcessorService.addLocalEvent(localEvent);
    this.gameState.getGameServer().setConnected(false);
  }

  private handleErrorEvent(event: Event): void {
    console.error("WebSocket error", event);
  }

  private handleMessage(event: MessageEvent) {
    const arrayBuffer: ArrayBuffer = event.data;
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    if (this.gameController.getDebugSettings().isWebSocketLoggingEnabled()) {
      console.debug(
        "%cReceived message from server:\n" + binaryReader.preview(),
        "color: green;"
      );
    }

    const typeId = binaryReader.unsignedInt8();

    switch (typeId) {
      case WebSocketType.Notification:
        this.handleNotificationMessage(binaryReader);
        break;

      case WebSocketType.PlayerIdentity:
        this.gameController
          .getMatchmakingService()
          .handlePlayerIdentity(binaryReader);
        break;

      case WebSocketType.Tunnel:
        this.gameController
          .getWebRTCService()
          .handleTunnelWebRTCData(binaryReader);
        break;

      default: {
        console.warn("Unknown websocket message identifier", typeId);
      }
    }
  }

  private handleNotificationMessage(binaryReader: BinaryReader) {
    const textBytes = binaryReader.bytesAsArrayBuffer();

    const message = new TextDecoder("utf-8").decode(textBytes);
    const localEvent = new LocalEvent<ServerNotificationPayload>(
      EventType.ServerNotification
    );

    localEvent.setData({
      message,
    });

    this.eventProcessorService.addLocalEvent(localEvent);
  }
}
