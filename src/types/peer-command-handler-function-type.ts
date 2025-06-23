import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";

export type PeerCommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;
