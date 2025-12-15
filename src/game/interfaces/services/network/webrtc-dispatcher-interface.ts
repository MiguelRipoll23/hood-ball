import type { WebRTCPeer } from "../../../../engine/interfaces/network/webrtc-peer-interface.js";
import type { WebRTCType } from "../../../../engine/enums/webrtc-type.js";
import type { BinaryReader } from "../../../../engine/utils/binary-reader-utils.js";

export interface WebRTCDispatcherContract {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: WebRTCType,
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
}
