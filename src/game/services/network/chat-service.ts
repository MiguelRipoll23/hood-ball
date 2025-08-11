import { WebSocketService } from "./websocket-service.js";
import { WebSocketType } from "../../enums/websocket-type.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { ServerCommandHandler } from "../../decorators/server-command-handler.js";
import { container } from "../../../core/services/di-container.js";
import { injectable } from "@needle-di/core";
import { WebRTCService } from "./webrtc-service.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { ChatMessage } from "../../models/chat-message.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { SignatureService } from "../security/signature-service.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";

@injectable()
export class ChatService {
  private static readonly MAX_HISTORY_SIZE = 50;

  private readonly messages: ChatMessage[] = [];
  private readonly listeners: ((messages: ChatMessage[]) => void)[] = [];
  private readonly webSocketService: WebSocketService;
  private readonly webrtcService: WebRTCService;
  private readonly signatureService: SignatureService;

  constructor() {
    this.webSocketService = container.get(WebSocketService);
    this.webrtcService = container.get(WebRTCService);
    this.signatureService = container.get(SignatureService);
    this.webrtcService.registerCommandHandlers(this);
    this.webSocketService.registerCommandHandlers(this);
  }

  public getMessages(): ChatMessage[] {
    return this.messages;
  }

  public onMessage(listener: (messages: ChatMessage[]) => void): void {
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

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener([...this.messages]);
    });
  }
}
