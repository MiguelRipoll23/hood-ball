import { injectable } from "@needle-di/core";
import { WEBSOCKET_ENDPOINT } from "../../constants/api-constants.js";
import { LocalEvent } from "@engine/models/events/local-event.js";
import { EventType } from "../../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../../interfaces/events/server-notification-payload.js";
import type { OnlinePlayersPayload } from "../../interfaces/events/online-players-payload.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { APIUtils } from "../../utils/api-utils.js";
import { GameState } from "../../state/game-state.js";
import { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import { WebSocketDispatcherService } from "./websocket-dispatcher-service.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { WebSocketReconnectionManager } from "./websocket-reconnection-manager.js";

type LocalEventListener = (event: LocalEvent<unknown>) => void;

@injectable()
export class WebSocketService {
  private readonly baseURL: string;
  private readonly dispatcherService: WebSocketDispatcherService;
  private readonly localEventListeners: LocalEventListener[] = [];

  private webSocket: WebSocket | null = null;
  private onlinePlayers = 0;

  constructor(
    private readonly gameState: GameState,
    dispatcherService: WebSocketDispatcherService,
    private readonly reconnectionManager: WebSocketReconnectionManager
  ) {
    this.baseURL = APIUtils.getWSBaseURL();
    this.dispatcherService = dispatcherService;
    this.dispatcherService.registerCommandHandlers(this);
  }

  public addLocalEventListener(listener: LocalEventListener): void {
    this.localEventListeners.push(listener);
  }

  public removeLocalEventListener(listener: LocalEventListener): void {
    const index = this.localEventListeners.indexOf(listener);
    if (index !== -1) {
      this.localEventListeners.splice(index, 1);
    }
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
    this.reconnectionManager.stop();

    if (this.webSocket !== null) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  public sendMessage(arrayBuffer: ArrayBuffer): void {
    if (this.webSocket === null || this.webSocket.readyState !== WebSocket.OPEN) {
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
      console.error("Failed to send message to server", error);
    }
  }

  @ServerCommandHandler(WebSocketType.Notification)
  public handleNotificationMessage(binaryReader: BinaryReader): void {
    const textBytes = binaryReader.bytesAsArrayBuffer();

    const message = new TextDecoder("utf-8").decode(textBytes);
    const localEvent = new LocalEvent<ServerNotificationPayload>(
      EventType.ServerNotification
    );

    localEvent.setData({ message });
    this.emitLocalEvent(localEvent);
  }

  @ServerCommandHandler(WebSocketType.OnlinePlayers)
  public handleOnlinePlayers(binaryReader: BinaryReader): void {
    const total = binaryReader.unsignedInt16();

    this.onlinePlayers = total;

    const localEvent = new LocalEvent<OnlinePlayersPayload>(
      EventType.OnlinePlayers
    );
    localEvent.setData({ total });

    this.emitLocalEvent(localEvent);
  }

  private attemptConnection(): void {
    const serverRegistration = this.gameState
      .getGameServer()
      .getServerRegistration();

    if (serverRegistration === null) {
      console.error("Game registration not found, cannot connect to server");
      this.scheduleReconnection();
      return;
    }

    const authenticationToken = serverRegistration.getAuthenticationToken();

    if (this.webSocket !== null) {
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
      this.scheduleReconnection();
    }
  }

  private addEventListeners(webSocket: WebSocket): void {
    webSocket.addEventListener("open", () => this.handleOpenEvent());
    webSocket.addEventListener("close", (event) => this.handleCloseEvent(event));
    webSocket.addEventListener("error", (event) => this.handleErrorEvent(event));
    webSocket.addEventListener("message", (event) => this.handleMessage(event));
  }

  private handleOpenEvent(): void {
    console.log("Connected to server");
    this.reconnectionManager.stop();

    this.gameState.getGameServer().setConnected(true);
    this.emitLocalEvent(new LocalEvent(EventType.ServerConnected));
  }

  private handleCloseEvent(event: CloseEvent): void {
    console.log("Connection closed", event);

    const wasConnected = this.gameState.getGameServer().isConnected();
    this.gameState.getGameServer().setConnected(false);

    if (wasConnected) {
      const localEvent = new LocalEvent<ServerDisconnectedPayload>(
        EventType.ServerDisconnected
      );
      localEvent.setData({ connectionLost: true });
      this.emitLocalEvent(localEvent);
    }

    if (wasConnected || this.reconnectionManager.isActive()) {
      this.scheduleReconnection();
    }
  }

  private handleErrorEvent(event: Event): void {
    console.error("WebSocket error", event);

    if (this.gameState.getGameServer().isConnected()) {
      this.gameState.getGameServer().setConnected(false);

      const localEvent = new LocalEvent<ServerDisconnectedPayload>(
        EventType.ServerDisconnected
      );
      localEvent.setData({ connectionLost: true });
      this.emitLocalEvent(localEvent);
    }

    this.scheduleReconnection();
  }

  private handleMessage(event: MessageEvent): void {
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
        `Error executing server command handler for ID ${commandId}:`,
        error
      );
    }
  }

  private scheduleReconnection(): void {
    if (this.webSocket !== null && this.webSocket.readyState === WebSocket.OPEN) {
      return;
    }

    const attemptReconnect = () => this.attemptConnection();

    if (this.reconnectionManager.isActive()) {
      this.reconnectionManager.scheduleNext(attemptReconnect);
    } else {
      this.reconnectionManager.start(attemptReconnect);
    }
  }

  private emitLocalEvent(event: LocalEvent<unknown>): void {
    this.localEventListeners.forEach((listener) => listener(event));
  }

  private isLoggingEnabled(): boolean {
    return this.gameState.getDebugSettings().isWebSocketLoggingEnabled();
  }
}
