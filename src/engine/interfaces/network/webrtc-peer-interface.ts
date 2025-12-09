import type { Player } from "../models/player-interface.js";

export interface WebRTCPeer {
  getConnectionState(): RTCPeerConnectionState;
  isConnected(): boolean;
  getToken(): string;
  getPingRequestTime(): number | null;
  getPingTime(): number | null;
  setPingTime(pingTime: number | null): void;
  getName(): string;
  getPlayer(): Player | null;
  setPlayer(player: Player): void;
  hasJoined(): boolean;
  setJoined(joined: boolean): void;
  disconnect(graceful: boolean): void;
  disconnectGracefully(): void;
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
  sendUnreliableUnorderedMessage(arrayBuffer: ArrayBuffer): void;
  getDownloadBytes(): number;
  getUploadBytes(): number;
  resetNetworkStats(): void;
}
