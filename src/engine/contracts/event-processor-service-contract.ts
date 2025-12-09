import type { EventQueueServiceContract } from "./event-queue-service-contract.ts";
import type { LocalEvent } from "../models/local-event.ts";
import type { RemoteEvent } from "../models/remote-event.ts";
import type { WebRTCServiceContract } from "./webrtc-service-contract.ts";
import type { BinaryReader } from "../utils/binary-reader-utils.ts";
import type { WebRTCPeer } from "../interfaces/network/webrtc-peer-interface.ts";

export interface EventProcessorServiceContract {
  initialize(webrtcService: WebRTCServiceContract): void;
  getLocalQueue(): EventQueueServiceContract<LocalEvent>;
  getRemoteQueue(): EventQueueServiceContract<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
