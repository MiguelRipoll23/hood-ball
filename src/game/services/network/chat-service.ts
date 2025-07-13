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
  private readonly messages: string[] = [];
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

  public sendMessage(text: string): void {
    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.ChatMessage)
      .variableLengthString(text)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);

    const playerName = this.gameState.getGamePlayer().getName();
    this.messages.push(`${playerName}: ${text}`);
  }

  @ServerCommandHandler(WebSocketType.ChatMessage)
  public handleChatMessage(binaryReader: BinaryReader): void {
    const playerId = binaryReader.fixedLengthString(32);
    const text = binaryReader.variableLengthString();
    const playerName =
      this.gameState.getMatch()?.getPlayer(playerId)?.getName() ?? playerId;

    this.messages.push(`${playerName}: ${text}`);
  }
}
