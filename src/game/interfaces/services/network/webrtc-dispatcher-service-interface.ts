import type { WebRTCPeer } from "../../../../engine/interfaces/network/webrtc-peer.js";
import type { WebRTCType } from "../../../../engine/enums/webrtc-type.js";
import type { BinaryReader } from "../../../../engine/utils/binary-reader-utils.js";

export interface IWebRTCDispatcherService {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
}
