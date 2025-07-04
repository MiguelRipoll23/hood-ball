import type { GamePlayer } from "../../../models/game-player.js";

export interface IWebRTCPeerService {
  getConnectionState(): RTCPeerConnectionState;
  isConnected(): boolean;
  getToken(): string;
  getName(): string;
  getPlayer(): GamePlayer | null;
  setPlayer(player: GamePlayer): void;
  hasJoined(): boolean;
  setJoined(joined: boolean): void;
  getDownloadBytes(): number;
  getUploadBytes(): number;
  resetNetworkStats(): void;
  getPingRequestTime(): number | null;
  addRemoteIceCandidate(iceCandidate: RTCIceCandidateInit): void;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  connect(answer: RTCSessionDescriptionInit): Promise<void>;
  getPingTime(): number | null;
  setPingTime(pingTime: number | null): void;
  disconnectGracefully(): void;
  disconnect(graceful?: boolean): void;
  sendReliableOrderedMessage(arrayBuffer: ArrayBuffer): void;
  sendReliableUnorderedMessage(arrayBuffer: ArrayBuffer): void;
  sendUnreliableOrderedMessage(arrayBuffer: ArrayBuffer): void;
  sendUnreliableUnorderedMessage(arrayBuffer: ArrayBuffer): void;
  sendPingRequest(): void;
}
