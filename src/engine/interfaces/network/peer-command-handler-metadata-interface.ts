import type { WebRTCType } from "../../../game/enums/webrtc-type.js";

export interface PeerCommandHandlerMetadata {
  commandId: WebRTCType;
  methodName: string;
  target: object;
}
