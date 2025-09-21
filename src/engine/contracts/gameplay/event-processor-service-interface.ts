import type { EventQueueServiceContract } from "./event-queue-service-interface.js";
import type { LocalEvent } from "../../../core/models/local-event.js";
import type { RemoteEvent } from "../../../core/models/remote-event.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import type { EngineWebRTCPeer } from "../network/webrtc-peer.js";

export interface IEventProcessorService {
  getLocalQueue(): EventQueueServiceContract<LocalEvent>;
  getRemoteQueue(): EventQueueServiceContract<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: EngineWebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
