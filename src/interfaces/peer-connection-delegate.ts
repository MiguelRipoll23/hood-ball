import type { WebRTCPeer } from "./webrtc-peer.js";

export interface PeerConnectionDelegate {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer): void;
}
