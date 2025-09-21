import { InjectionToken } from "@needle-di/core";
import type { EngineWebRTCPeer } from "./webrtc-peer.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export interface EngineWebRTCService {
  registerCommandHandlers(instance: object): void;
  bindCommandHandler(
    commandId: number,
    handler: (peer: EngineWebRTCPeer, reader: BinaryReader) => void,
    label?: string
  ): void;
  getPeers(): EngineWebRTCPeer[];
}

export const ENGINE_WEBRTC_SERVICE_TOKEN = new InjectionToken(
  "EngineWebRTCService"
);
