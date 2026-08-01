import { InjectionToken } from "@needle-di/core";
import type { WebRTCPeer } from "../../network/webrtc-peer-interface.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";
import type { WebRTCType } from "../../../enums/webrtc-type.js";

export interface WebRTCServiceContract {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(
    commandId: WebRTCType,
    peer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void;
  sendIceCandidate(token: string, iceCandidate: RTCIceCandidateInit): void;
  removePeer(token: string): void;
  getPeers(): WebRTCPeer[];
  sendOffer(token: string): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}

export const WEB_RTC_SERVICE_TOKEN =
  new InjectionToken<WebRTCServiceContract>("WebRTCServiceContract");
