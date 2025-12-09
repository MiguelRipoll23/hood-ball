import type { BinaryReader } from "../../../../engine/utils/binary-reader-utils.js";
import type { WebRTCPeer } from "../../../../engine/interfaces/network/webrtc-peer-interface.js";

export interface MatchmakingNetworkServiceContract {
  startFindMatchesTimer(resolve: () => void): void;
  stopFindMatchesTimer(): void;
  startPingCheckInterval(): void;
  removePingCheckInterval(): void;
  startAdvertiseMatchInterval(): void;
  removeAdvertiseMatchInterval(): void;
  handlePlayerIdentity(binaryReader: BinaryReader): void;
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer, graceful: boolean): void;
  handleJoinRequest(peer: WebRTCPeer): void;
  handleJoinResponse(peer: WebRTCPeer, binaryReader: BinaryReader): void;
  handlePlayerConnection(peer: WebRTCPeer, binaryReader: BinaryReader): void;
  handleSnapshotEnd(peer: WebRTCPeer): void;
  handleSnapshotACK(peer: WebRTCPeer): void;
  handlePlayerPing(peer: WebRTCPeer, binaryReader: BinaryReader): void;
}
