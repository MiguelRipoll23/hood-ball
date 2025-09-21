import { InjectionToken } from "@needle-di/core";

export interface WebRTCCommandMap {
  /** Identifier for the peer command that carries event payloads. */
  eventData: number;
}

export const WEBRTC_COMMAND_MAP_TOKEN = new InjectionToken(
  "WebRTCCommandMap"
);
