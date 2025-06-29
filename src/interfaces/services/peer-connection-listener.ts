export interface PeerConnectionListener {
  onPeerConnected(peer: import('../webrtc-peer.js').WebRTCPeer): void;
  onPeerDisconnected(peer: import('../webrtc-peer.js').WebRTCPeer): void;
}
