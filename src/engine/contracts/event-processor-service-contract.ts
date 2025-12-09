import type { EventQueueServiceContract } from "./event-queue-service-contract.js";
import type { LocalEvent } from "../models/local-event.js";
import type { RemoteEvent } from "../models/remote-event.js";
import type { WebRTCServiceContract } from "./webrtc-service-contract.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";
import type { WebRTCPeer } from "../interfaces/network/webrtc-peer.js";

export interface EventProcessorServiceContract {
  initialize(webrtcService: WebRTCServiceContract): void;
  getLocalQueue(): EventQueueServiceContract<LocalEvent>;
  getRemoteQueue(): EventQueueServiceContract<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
