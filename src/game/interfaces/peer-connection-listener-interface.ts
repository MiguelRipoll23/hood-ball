import type { WebRTCPeer } from "../../engine/interfaces/network/webrtc-peer-interface.js";

export interface PeerConnectionListener {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer, graceful: boolean): void;
}
