import type { WebRTCPeer } from "./webrtc-peer.js";

export interface PeerConnectionListener {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer): void;
}
