import type { WebRTCPeer } from "../../engine/interfaces/network/webrtc-peer.js";
import type { BinaryReader } from "../../engine/utils/binary-reader-utils.js";

export type PeerCommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;
