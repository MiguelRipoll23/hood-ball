export interface EngineWebRTCPeer {
  hasJoined(): boolean;
  isHost(): boolean;
  sendReliableOrderedMessage(arrayBuffer: ArrayBuffer): void;
}
