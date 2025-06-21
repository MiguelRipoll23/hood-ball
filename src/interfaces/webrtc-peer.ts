import type { WebRTCType } from "../enums/webrtc-type.js";
import { GamePlayer } from "../models/game-player.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";

export interface WebRTCPeer {
  getConnectionState(): RTCPeerConnectionState;
  isConnected(): boolean;
  getToken(): string;
  getPingTime(): number | null;
  getName(): string;
  getPlayer(): GamePlayer | null;
  setPlayer(player: GamePlayer): void;
  hasJoined(): boolean;
  setJoined(joined: boolean): void;
  disconnect(): void;
  disconnectGracefully(): void;
  addCommandHandler(
    type: WebRTCType,
    handler: (binaryReader: BinaryReader) => void
  ): void;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit>;
  connect(answer: RTCSessionDescriptionInit): Promise<void>;
  addRemoteIceCandidate(iceCandidate: RTCIceCandidateInit): void;
  sendPingRequest(): void;
  sendReliableOrderedMessage(
    arrayBuffer: ArrayBuffer,
    skipQueue?: boolean
  ): void;
  sendReliableUnorderedMessage(
    arrayBuffer: ArrayBuffer,
    skipQueue?: boolean
  ): void;
  sendUnreliableOrderedMessage(arrayBuffer: ArrayBuffer): void;
  sendUnreliableUnorderedMessage(arrayBuffer: ArrayBuffer): void;
  getDownloadBytes(): number;
  getUploadBytes(): number;
  resetNetworkStats(): void;
}
