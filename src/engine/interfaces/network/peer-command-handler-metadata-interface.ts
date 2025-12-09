import type { WebRTCType } from "../../enums/webrtc-type.ts";

export interface PeerCommandHandlerMetadata {
  commandId: WebRTCType;
  methodName: string;
  target: object;
}
