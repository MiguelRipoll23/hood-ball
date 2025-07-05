import type { BinaryReader } from "../../../../core/utils/binary-reader-utils.js";
import type { WebRTCPeer } from "./webrtc-peer.js";

export interface IMatchmakingNetworkService {
  startFindMatchesTimer(resolve: () => void): void;
  stopFindMatchesTimer(): void;
  startPingCheckInterval(): void;
  removePingCheckInterval(): void;
  handlePlayerIdentity(binaryReader: BinaryReader): void;
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer): void;
  handleJoinRequest(peer: WebRTCPeer): void;
  handleJoinResponse(peer: WebRTCPeer, binaryReader: BinaryReader): void;
  handlePlayerConnection(peer: WebRTCPeer, binaryReader: BinaryReader): void;
  handleSnapshotEnd(peer: WebRTCPeer): void;
  handleSnapshotACK(peer: WebRTCPeer): void;
  handlePlayerPing(peer: WebRTCPeer, binaryReader: BinaryReader): void;
}
