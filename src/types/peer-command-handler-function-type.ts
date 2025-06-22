import type { WebRTCPeer } from "../interfaces/webrtc/webrtc-peer";
import type { BinaryReader } from "../utils/binary-reader-utils";

export type PeerCommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;
