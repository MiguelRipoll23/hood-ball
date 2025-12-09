import { WebSocketService } from "./websocket-service.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { injectable, inject } from "@needle-di/core";
import { WebRTCService } from "./webrtc-service.js";
import { WebRTCType } from "../../../engine/enums/webrtc-type.js";
import { ChatMessage } from "../../models/chat-message.js";
import { MatchAction } from "../../models/match-action.js";
import { PeerCommandHandler } from "../../../engine/decorators/peer-command-handler-decorator.js";
import { SignatureService } from "../security/signature-service.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { EventType } from "../../../engine/enums/event-type.js";
import { GamePlayer } from "../../models/game-player.js";
import { MatchActionsLogService } from "../gameplay/match-actions-log-service.js";
import type { WebSocketServiceContract } from "../../interfaces/services/network/websocket-service-interface.js";
import type { WebRTCServiceContract } from "../../../engine/interfaces/services/network/webrtc-service-contract.js";

@injectable()
export class ChatService {
  private static readonly MAX_HISTORY_SIZE = 50;
  private static readonly LOG_THROTTLE_MS = 500;

  private readonly messages: ChatMessage[] = [];
  private readonly listeners: ((messages: ChatMessage[]) => void)[] = [];
  private readonly localPlayerId: string;
  private readonly commandLogTimestamps = new Map<string, number>();

  constructor(
    private readonly webSocketService: WebSocketServiceContract = inject(
      WebSocketService
    ),
    private readonly webrtcService: WebRTCServiceContract = inject(
      WebRTCService
    ),
    private readonly signatureService: SignatureService = inject(
      SignatureService
    ),
    private readonly eventProcessorService: EventProcessorService = inject(
      EventProcessorService
    ),
    private readonly gamePlayer: GamePlayer = inject(GamePlayer),
    private readonly matchActionsLogService: MatchActionsLogService = inject(
      MatchActionsLogService
    )
  ) {
    this.localPlayerId = this.gamePlayer.getNetworkId();
    this.webrtcService.registerCommandHandlers?.(this);
    this.webSocketService.registerCommandHandlers(this);
  }

  public getMessages(): ChatMessage[] {
    return this.messages;
  }

  public onMessage(listener: (messages: ChatMessage[]) => void): () => void {
    this.listeners.push(listener);
    // Deliver current snapshot if available (prevents blank UI on first subscribe)
    if (this.messages.length > 0) {
      listener([...this.messages]);
    }

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public clearMessages(): void {
    this.messages.length = 0;
    this.listeners.forEach((listener) => {
      listener([]);
    });
  }

  public sendMessage(text: string): void {
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      console.warn("Chat message empty");
      return;
    }

    // Execute local command effects immediately
    this.handleCommand(trimmed, undefined, Date.now());

    const payload = BinaryWriter.build()
      .unsignedInt8(WebSocketType.ChatMessage)
      .variableLengthString(trimmed)
      .toArrayBuffer();

    this.webSocketService.sendMessage(payload);
  }

  @ServerCommandHandler(WebSocketType.ChatMessage)
  public handleChatMessage(binaryReader: BinaryReader): void {
    const userId = binaryReader.fixedLengthString(32);
    const text = binaryReader.variableLengthString();
    const timestamp = binaryReader.unsignedInt32();
    const signature = binaryReader.bytesAsArrayBuffer();

    // Send to other players
    const chatMessagePayload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.ChatMessage)
      .fixedLengthString(userId, 32)
      .variableLengthString(text)
      .unsignedInt32(timestamp)
      .arrayBuffer(signature)
      .toArrayBuffer();

    this.webrtcService.getPeers().forEach((peer) => {
      peer.sendReliableUnorderedMessage(chatMessagePayload);
    });

    // Execute command and skip chat output if handled
    if (this.handleCommand(text, userId, timestamp)) {
      return;
    }

    // Add message to UI
    const chatMessage = new ChatMessage(userId, text, timestamp);
    this.addMessage(chatMessage);
  }

  @PeerCommandHandler(WebRTCType.ChatMessage)
  public async handlePeerChatMessage(
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): Promise<void> {
    // Mark the current position
    binaryReader.mark();

    const userId = binaryReader.fixedLengthString(32);
    const text = binaryReader.variableLengthString();
    const timestampSeconds = binaryReader.unsignedInt32();
    const signature = binaryReader.bytesAsArrayBuffer();

    // Validate signature
    const payload = binaryReader.getMarkedBytes();
    const valid = await this.signatureService.verifyArrayBuffer(
      payload,
      signature
    );

    if (valid === false) {
      console.warn("Invalid chat message signature from peer", peer.getName());
      return;
    }

    // Execute command and skip chat output if handled
    if (this.handleCommand(text, userId, timestampSeconds)) {
      return;
    }

    // Add message to UI
    const chatMessage = new ChatMessage(userId, text, timestampSeconds);
    this.addMessage(chatMessage);
  }

  private addMessage(chatMessage: ChatMessage): void {
    this.messages.push(chatMessage);

    // Keep only the last MAX_HISTORY_SIZE messages
    if (this.messages.length > ChatService.MAX_HISTORY_SIZE) {
      this.messages.shift();
    }

    this.matchActionsLogService.addAction(
      MatchAction.chatMessage(chatMessage.getUserId(), chatMessage.getText(), {
        timestamp: chatMessage.getTimestamp(),
      })
    );

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener([...this.messages]);
    });
  }

  private handleCommand(
    text: string,
    senderId?: string,
    timestamp?: number
  ): boolean {
    if (!text.startsWith("/")) {
      return false;
    }

    const command = text.slice(1).toLowerCase();

    switch (command) {
      case "snow":
        if (!senderId || senderId !== this.localPlayerId) {
          console.log("Snow weather command received");
          const event = new LocalEvent<void>(EventType.SnowWeather);
          this.eventProcessorService.addLocalEvent(event);
        }
        this.logChatCommand(senderId, command, timestamp);
        return true;
      default:
        return false;
    }
  }

  private logChatCommand(
    senderId: string | undefined,
    command: string,
    timestamp?: number
  ): void {
    const playerId = senderId ?? this.localPlayerId;
    const key = `${playerId}:${command}`;
    const now = timestamp ?? Date.now();
    const lastLoggedAt = this.commandLogTimestamps.get(key);

    if (
      lastLoggedAt !== undefined &&
      now - lastLoggedAt < ChatService.LOG_THROTTLE_MS
    ) {
      return;
    }

    this.commandLogTimestamps.set(key, now);
    this.matchActionsLogService.addAction(
      MatchAction.chatCommand(playerId, command, { timestamp: now })
    );
  }
}
