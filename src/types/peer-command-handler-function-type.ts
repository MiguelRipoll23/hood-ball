import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import type { BinaryReader } from "../core/utils/binary-reader-utils.js";

export type PeerCommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;
