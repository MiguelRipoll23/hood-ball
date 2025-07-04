import type { WebRTCPeer } from "../../webrtc-peer.js";
import type { WebRTCType } from "../../../enums/webrtc-type.js";
import type { BinaryReader } from "../../../core/utils/binary-reader-utils.js";

export interface IWebRTCDispatcherService {
  registerCommandHandlers(instance: any): void;
  dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
}
