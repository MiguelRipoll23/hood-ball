import type { WebRTCPeer } from "../../interfaces/webrtc-peer.js";
import type { WebRTCType } from "../../enums/webrtc-type.js";
import type { BinaryReader } from "../../utils/binary-reader-utils.js";

export interface IWebRTCService {
  initialize(): void;
  registerCommandHandlers(instance: any): void;
  dispatchCommand(commandId: WebRTCType, peer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendOffer(token: string): Promise<void>;
  sendIceCandidate(token: string, iceCandidate: RTCIceCandidateInit): void;
  getPeers(): WebRTCPeer[];
  removePeer(token: string): void;
  resetNetworkStats(): void;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
