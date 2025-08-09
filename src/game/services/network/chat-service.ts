import { WebSocketService } from "./websocket-service.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { GameState } from "../../../core/models/game-state.js";
import { container } from "../../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class ChatService {
  private static readonly MAX_MESSAGE_LENGTH = 35;
  private static readonly MAX_HISTORY_SIZE = 50;

  private readonly messages: string[] = [];
  private readonly listeners: ((messages: string[]) => void)[] = [];
  private readonly webSocketService: WebSocketService;
  private readonly gameState: GameState;

  constructor() {
    this.webSocketService = container.get(WebSocketService);
    this.gameState = container.get(GameState);
    this.webSocketService.registerCommandHandlers(this);
  }

  public getMessages(): string[] {
    return this.messages;
  }

  public onMessage(listener: (messages: string[]) => void): void {
    this.listeners.push(listener);
  }

  public clearMessages(): void {
    this.messages.length = 0;
  }

  public sendMessage(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      console.warn("Chat message empty");
      return;
    }

    if (trimmed.length > ChatService.MAX_MESSAGE_LENGTH) {
      console.warn("Chat message exceeds max length");
      return;
    }

    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.ChatMessage)
      .variableLengthString(trimmed)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);
  }

  @ServerCommandHandler(WebSocketType.ChatMessage)
  public handleChatMessage(binaryReader: BinaryReader): void {
    const playerId = binaryReader.fixedLengthString(32);
    const text = binaryReader.variableLengthString();

    if (!playerId || !text) {
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      console.warn("Received empty chat message");
      return;
    }

    if (trimmed.length > ChatService.MAX_MESSAGE_LENGTH) {
      console.warn("Received chat message exceeding max length");
      return;
    }

    const playerName =
      this.gameState.getMatch()?.getPlayerByNetworkId(playerId)?.getName() ??
      playerId;

    this.addMessage(`${playerName}: ${trimmed}`);
  }

  private addMessage(message: string): void {
    if (this.messages.length >= ChatService.MAX_HISTORY_SIZE) {
      this.messages.shift();
    }

    this.messages.push(message);
    this.listeners.forEach((l) => l(this.messages));
  }
}
