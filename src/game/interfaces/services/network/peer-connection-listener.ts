import type { WebRTCPeer } from "../../../../engine/interfaces/network/webrtc-peer.js";

export interface PeerConnectionListener {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer, graceful: boolean): void;
}
