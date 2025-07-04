import { WEBSOCKET_ENDPOINT } from "../../constants/api-constants.js";
import { EventProcessorService } from "../../core/services/event-processor-service.js";
import { LocalEvent } from "../../core/services/local-event.js";
import { EventType } from "../../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../../interfaces/events/server-notification-payload.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { APIUtils } from "../../utils/api-utils.js";
import { GameState } from "../../core/services/game-state.js";
import { BinaryReader } from "../../core/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../core/utils/binary-writer-utils.js";
import { WebSocketDispatcherService } from "./websocket-dispatcher-service.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class WebSocketService {
  private baseURL: string;
  private webSocket: WebSocket | null = null;

  private eventProcessorService: EventProcessorService;
  private dispatcherService: WebSocketDispatcherService;

  constructor(private gameState = container.get(GameState)) {
    this.baseURL = APIUtils.getWSBaseURL();
    this.eventProcessorService = container.get(EventProcessorService);
    this.dispatcherService = new WebSocketDispatcherService();
    this.dispatcherService.registerCommandHandlers(this);
  }

  public registerCommandHandlers(instance: any): void {
    this.dispatcherService.registerCommandHandlers(instance);
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

      if (this.isLoggingEnabled()) {
        console.debug(
          "%cSent message to server:\n" + BinaryWriter.preview(arrayBuffer),
          "color: purple"
        );
      }
    } catch (error) {
      console.error(`Failed to send message to server`, error);
    }
  }

  @ServerCommandHandler(WebSocketType.Notification)
  public handleNotificationMessage(binaryReader: BinaryReader) {
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

  private addEventListeners(webSocket: WebSocket): void {
    webSocket.addEventListener("open", this.handleOpenEvent.bind(this));
    webSocket.addEventListener("close", this.handleCloseEvent.bind(this));
    webSocket.addEventListener("error", this.handleErrorEvent.bind(this));
    webSocket.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleOpenEvent(): void {
    console.log("Connected to server");
    this.gameState.getGameServer().setConnected(true);
    this.eventProcessorService.addLocalEvent(
      new LocalEvent(EventType.ServerConnected)
    );
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

    if (this.isLoggingEnabled()) {
      console.debug(
        "%cReceived message from server:\n" + binaryReader.preview(),
        "color: green;"
      );
    }

    const commandId = binaryReader.unsignedInt8();

    try {
      this.dispatcherService.dispatchCommand(commandId, binaryReader);
    } catch (error) {
      console.error(
        `Error executing server command handler for ID ${commandId}}:`,
        error
      );
    }
  }

  private isLoggingEnabled(): boolean {
    return this.gameState.getDebugSettings().isWebSocketLoggingEnabled();
  }
}
