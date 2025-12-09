import type { WebRTCPeer } from "./webrtc-peer.js";
import type { BinaryReader } from "../../utils/binary-reader-utils.js";
import type { WebRTCType } from "../../enums/webrtc-type.js";

export interface WebRTCServiceContract {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: WebRTCType,
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
  sendIceCandidate(token: string, iceCandidate: RTCIceCandidateInit): void;
  removePeer(token: string): void;
  getPeers(): WebRTCPeer[];
}
