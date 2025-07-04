import type { IEventQueueService } from "./event-queue-service-interface.js";
import type { LocalEvent } from "../../../core/services/local-event.js";
import type { RemoteEvent } from "../../../core/services/remote-event.js";
import type { IWebRTCService } from "../network/webrtc-service-interface.js";
import type { WebRTCPeer } from "../../webrtc-peer.js";
import type { BinaryReader } from "../../../core/utils/binary-reader-utils.js";

export interface IEventProcessorService {
  initialize(webrtcService: IWebRTCService): void;
  getLocalQueue(): IEventQueueService<LocalEvent>;
  getRemoteQueue(): IEventQueueService<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
