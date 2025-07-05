import type { WebRTCType } from "../../../enums/webrtc-type.js";

export interface PeerCommandHandlerMetadata {
  commandId: WebRTCType;
  methodName: string;
  target: object;
}
