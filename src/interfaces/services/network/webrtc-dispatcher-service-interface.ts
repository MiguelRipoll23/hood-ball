import type { WebRTCPeer } from "../../webrtc-peer.js";
import type { WebRTCType } from "../../../enums/webrtc-type.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";
import type { PeerCommandHandlerFunction } from "../../../types/peer-command-handler-function-type.js";

export interface IWebRTCDispatcherService {
  registerCommandHandlers(instance: any): void;
  dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
}
