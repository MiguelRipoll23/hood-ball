import type { EventQueueServiceContract } from "./event-queue-service-interface.js";
import type { LocalEvent } from "../../../models/local-event.js";
import type { RemoteEvent } from "../../../models/remote-event.js";
import type { WebRTCServiceContract } from "../../network/webrtc-service-interface.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";
import type { WebRTCPeer } from "../../network/webrtc-peer.js";

export interface IEventProcessorService {
  initialize(webrtcService: WebRTCServiceContract): void;
  getLocalQueue(): EventQueueServiceContract<LocalEvent>;
  getRemoteQueue(): EventQueueServiceContract<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
