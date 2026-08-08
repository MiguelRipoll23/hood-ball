import { InjectionToken } from "@needle-di/core";
import type { EventQueueServiceContract } from "./event-queue-service-contract.js";
import type { LocalEvent } from "../../../models/local-event.js";
import type { RemoteEvent } from "../../../models/remote-event.js";
import type { WebRTCServiceContract } from "../network/webrtc-service-contract.js";

export interface EventProcessorServiceContract {
  setWebRTCService(webrtcService: WebRTCServiceContract): void;
  getLocalQueue(): EventQueueServiceContract<LocalEvent>;
  getRemoteQueue(): EventQueueServiceContract<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  sendEvent(event: RemoteEvent): void;
}

export const EVENT_PROCESSOR_SERVICE_TOKEN =
  new InjectionToken<EventProcessorServiceContract>(
    "EventProcessorServiceContract"
  );
