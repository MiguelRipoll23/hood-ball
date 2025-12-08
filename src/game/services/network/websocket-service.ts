import { WEBSOCKET_ENDPOINT } from "../../constants/api-constants.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../../interfaces/events/server-notification-payload.js";
import type { OnlinePlayersPayload } from "../../interfaces/events/online-players-payload.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { APIUtils } from "../../utils/api-utils.js";
import { GameState } from "../../../engine/models/game-state.js";
import { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../../engine/utils/binary-writer-utils.js";
import { WebSocketDispatcherService } from "./websocket-dispatcher-service.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { container } from "../../../engine/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class WebSocketService {
  private baseURL: string;
  private webSocket: WebSocket | null = null;

  private onlinePlayers = 0;

  private eventProcessorService: EventProcessorService;
  private dispatcherService: WebSocketDispatcherService;

  // Reconnection properties
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds between attempts
  private maxReconnectAttempts = 50; // Maximum number of reconnection attempts (0 = unlimited)
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private gameState = container.get(GameState)) {
    this.baseURL = APIUtils.getWSBaseURL();
    this.eventProcessorService = container.get(EventProcessorService);
    this.dispatcherService = new WebSocketDispatcherService();
    this.dispatcherService.registerCommandHandlers(this);
  }

  public getOnlinePlayers(): number {
    return this.onlinePlayers;
  }

  public registerCommandHandlers(instance: object): void {
    this.dispatcherService.registerCommandHandlers(instance);
  }

  public connectToServer(): void {
    this.attemptConnection();
  }

  public disconnect(): void {
    this.stopReconnection();

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  private attemptConnection(): void {
    const gameServer = this.gameState.getGameServer();
    const serverRegistration = gameServer.getServerRegistration();

    if (serverRegistration === null) {
      console.error("Game registration not found, cannot connect to server");
      if (this.isReconnecting) {
        this.scheduleReconnection();
      }
      return;
    }

    const authenticationToken = serverRegistration.getAuthenticationToken();

    // Close existing connection if any
    if (this.webSocket) {
      this.webSocket.close();
    }

    try {
      this.webSocket = new WebSocket(
        this.baseURL +
          WEBSOCKET_ENDPOINT +
          `?access_token=${authenticationToken}`
      );

      this.webSocket.binaryType = "arraybuffer";
      this.addEventListeners(this.webSocket);
    } catch (error) {
      console.error("Failed to create WebSocket connection", error);
      if (this.isReconnecting) {
        this.scheduleReconnection();
      }
    }
  }

  private startReconnection(): void {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts = 0;
    this.scheduleReconnection();
  }

  private stopReconnection(): void {
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private scheduleReconnection(): void {
    if (!this.isReconnecting) {
      return;
    }

    this.reconnectAttempts++;

    // Check if we've exceeded max attempts (0 means unlimited)
    if (
      this.maxReconnectAttempts > 0 &&
      this.reconnectAttempts > this.maxReconnectAttempts
    ) {
      console.log(
        `Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`
      );
      this.stopReconnection();
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.isReconnecting) {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.attemptConnection();
      }
    }, delay);
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
    const channelId = binaryReader.unsignedInt8();
    const messageBytes = binaryReader.bytesAsArrayBuffer();

    const message = new TextDecoder("utf-8").decode(messageBytes);
    const localEvent = new LocalEvent<ServerNotificationPayload>(
      EventType.ServerNotification
    );

    localEvent.setData({
      channelId,
      message,
    });

    this.eventProcessorService.addLocalEvent(localEvent);
  }

  @ServerCommandHandler(WebSocketType.OnlinePlayers)
  public handleOnlinePlayers(binaryReader: BinaryReader) {
    const total = binaryReader.unsignedInt16();

    this.onlinePlayers = total;

    const localEvent = new LocalEvent<OnlinePlayersPayload>(
      EventType.OnlinePlayers
    );
    localEvent.setData({
      total,
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

    // Stop any ongoing reconnection attempts
    this.stopReconnection();

    this.gameState.getGameServer().setConnected(true);
    this.eventProcessorService.addLocalEvent(
      new LocalEvent(EventType.ServerConnected)
    );
  }

  private handleCloseEvent(event: CloseEvent): void {
    console.log("Connection closed", event);

    const wasConnected = this.gameState.getGameServer().isConnected();
    this.gameState.getGameServer().setConnected(false);

    // Only emit disconnected event if we were actually connected
    if (wasConnected) {
      const payload = {
        connectionLost: true,
      };

      const localEvent = new LocalEvent<ServerDisconnectedPayload>(
        EventType.ServerDisconnected
      );

      localEvent.setData(payload);
      this.eventProcessorService.addLocalEvent(localEvent);
    }

    // Start or continue reconnection if this was an unexpected disconnection or failed reconnection attempt
    if (wasConnected || this.isReconnecting) {
      if (!this.isReconnecting) {
        this.startReconnection();
      } else {
        console.log(
          `Reconnection attempt ${this.reconnectAttempts} failed, scheduling next attempt`
        );
        this.scheduleReconnection();
      }
    }
  }

  private handleErrorEvent(event: Event): void {
    console.error("WebSocket error", event);

    // If we're connected and get an error, treat it like a disconnection
    if (this.gameState.getGameServer().isConnected()) {
      this.gameState.getGameServer().setConnected(false);

      const payload = {
        connectionLost: true,
      };

      const localEvent = new LocalEvent<ServerDisconnectedPayload>(
        EventType.ServerDisconnected
      );

      localEvent.setData(payload);
      this.eventProcessorService.addLocalEvent(localEvent);

      this.startReconnection();
    } else if (this.isReconnecting) {
      // If we're in the middle of reconnecting and get an error, schedule next attempt
      console.log(
        `Reconnection attempt ${this.reconnectAttempts} failed, scheduling next attempt`
      );
      this.scheduleReconnection();
    }
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
