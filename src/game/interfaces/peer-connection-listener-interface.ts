import type { WebRTCPeer } from "../../engine/interfaces/network/webrtc-peer-interface.ts";

export interface PeerConnectionListener {
  onPeerConnected(peer: WebRTCPeer): void;
  onPeerDisconnected(peer: WebRTCPeer, graceful: boolean): void;
}
