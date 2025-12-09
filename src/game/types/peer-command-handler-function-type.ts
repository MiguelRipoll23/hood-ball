import type { WebRTCPeer } from "../../engine/interfaces/network/webrtc-peer-interface.ts";
import type { BinaryReader } from "../../engine/utils/binary-reader-utils.ts";

export type PeerCommandHandlerFunction = (
  webrtcPeer: WebRTCPeer,
  binaryReader: BinaryReader
) => void;
