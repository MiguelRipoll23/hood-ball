import type { WebRTCPeer } from "./webrtc-peer.js";
import type { WebRTCType } from "../../../enums/webrtc-type.js";
import type { BinaryReader } from "../../../../engine/utils/binary-reader-utils.js";

export interface IWebRTCDispatcherService {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
}
