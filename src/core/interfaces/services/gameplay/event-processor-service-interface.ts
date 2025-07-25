import type { IEventQueueService } from "./event-queue-service-interface.js";
import type { LocalEvent } from "../../../models/local-event.js";
import type { RemoteEvent } from "../../../models/remote-event.js";
import type { IWebRTCService } from "../../../../game/interfaces/services/network/webrtc-service-interface.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";
import type { WebRTCPeer } from "../../../../game/interfaces/services/network/webrtc-peer.js";

export interface IEventProcessorService {
  initialize(webrtcService: IWebRTCService): void;
  getLocalQueue(): IEventQueueService<LocalEvent>;
  getRemoteQueue(): IEventQueueService<RemoteEvent>;
  addLocalEvent(event: LocalEvent): void;
  handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void;
  sendEvent(event: RemoteEvent): void;
}
