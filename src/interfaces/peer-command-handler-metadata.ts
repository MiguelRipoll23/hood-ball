import type { WebRTCType } from "../enums/webrtc-type";

export interface PeerCommandHandlerMetadata {
  commandId: WebRTCType;
  methodName: string;
  target: object;
}
