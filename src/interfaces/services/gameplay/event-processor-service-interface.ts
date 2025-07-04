import type { EventQueueService } from "../../../services/gameplay/event-queue-service.js";
import type { LocalEvent } from "../../../models/local-event.js";
import type { RemoteEvent } from "../../../models/remote-event.js";
import type { IWebRTCService } from "../network/webrtc-service-interface.js";
import type { WebRTCPeer } from "../../webrtc-peer.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";

export interface IEventProcessorService {
  initialize(webrtcService: IWebRTCService): void;
  getLocalQueue(): EventQueueService<LocalEvent>;
  getRemoteQueue(): EventQueueService<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
