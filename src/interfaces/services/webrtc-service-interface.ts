export interface IWebRTCService {
  registerCommandHandlers(instance: any): void;
  dispatchCommand(
    commandId: number,
    peer: import("../webrtc-peer.js").WebRTCPeer,
    binaryReader: import("../../utils/binary-reader-utils.js").BinaryReader
  ): void;
  sendIceCandidate(token: string, iceCandidate: RTCIceCandidateInit): void;
  removePeer(token: string): void;
  getPeers(): import("../webrtc-peer.js").WebRTCPeer[];
}
