import type { EventType } from "../../enums/event-type.js";
import { EventTypeNames } from "../../enums/event-type.js";
import { RemoteEvent } from "../../models/remote-event.js";
import { LocalEvent } from "../../models/local-event.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { EventQueueService } from "./event-queue-service.js";
import type { EventProcessorServiceContract } from "../../interfaces/services/events/event-processor-service-contract.js";
import type { EventQueueServiceContract } from "../../interfaces/services/events/event-queue-service-contract.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import type { WebRTCServiceContract } from "../../interfaces/services/network/webrtc-service-contract.js";
import { injectable } from "@needle-di/core";
import type { WebRTCPeer } from "../../interfaces/network/webrtc-peer-interface.js";
import { EngineLogger } from "../engine-logger.js";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

@injectable()
export class EventProcessorService implements EventProcessorServiceContract {
  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;
  private webrtcService: WebRTCServiceContract | null = null;

  constructor() {
    this.localQueue = new EventQueueService<LocalEvent>();
    this.remoteQueue = new EventQueueService<RemoteEvent>();
  }

  public setWebRTCService(webrtcService: WebRTCServiceContract): void {
    this.webrtcService = webrtcService;
    EngineLogger.info("EventProcessor", "Event processor service initialized");
  }

  public getLocalQueue(): EventQueueServiceContract<LocalEvent> {
    return this.localQueue;
  }

  public getRemoteQueue(): EventQueueServiceContract<RemoteEvent> {
    return this.remoteQueue;
  }

  public addLocalEvent(event: LocalEvent) {
    EngineLogger.info("EventProcessor", `Added local event ${EventTypeNames[event.getType()] ?? event.getType()}`, event);
    this.localQueue.addEvent(event);
  }

  public sendEvent(event: RemoteEvent) {
    EngineLogger.info("EventProcessor", `Sending remote event ${EventTypeNames[event.getType()] ?? event.getType()}`, event);

    this.getWebRTCService()
      .getPeers()
      .forEach((webrtcPeer) => {
        if (webrtcPeer.hasJoined()) {
          this.sendEventToPeer(webrtcPeer, event);
        }
      });
  }

  private getWebRTCService(): WebRTCServiceContract {
    if (this.webrtcService === null) {
      throw new Error("WebRTCService is not initialized");
    }

    return this.webrtcService;
  }

  private sendEventToPeer(webrtcPeer: WebRTCPeer, event: RemoteEvent) {
    const eventTypeId = event.getType();
    const eventData = event.getData();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.EventData)
      .unsignedInt8(eventTypeId)
      .arrayBuffer(eventData ?? new ArrayBuffer(0))
      .toArrayBuffer();

    webrtcPeer.sendReliableOrderedMessage(payload);
  }
}
