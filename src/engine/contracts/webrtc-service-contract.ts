import type { WebRTCPeer } from "../interfaces/network/webrtc-peer-interface.ts";
import type { BinaryReader } from "../utils/binary-reader-utils.ts";
import type { WebRTCType } from "../enums/webrtc-type.ts";

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
