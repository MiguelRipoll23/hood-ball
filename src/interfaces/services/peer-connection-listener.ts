import type { WebRTCPeer } from "../webrtc-peer";

export interface PeerConnectionListener {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer): void;
}
