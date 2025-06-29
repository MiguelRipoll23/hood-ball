import type { WebRTCPeer } from "../webrtc-peer.js";
import type { BinaryReader } from "../../utils/binary-reader-utils.js";

export interface IWebRTCService {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: number,
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
  sendIceCandidate(token: string, iceCandidate: RTCIceCandidateInit): void;
  removePeer(token: string): void;
  getPeers(): WebRTCPeer[];
}
