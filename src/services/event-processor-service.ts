import { EventType } from "../enums/event-type.js";
import { RemoteEvent } from "../models/remote-event.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { LocalEvent } from "../models/local-event.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { EventQueueService } from "./event-queue-service.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";
import { PeerCommandHandler } from "../decorators/peer-command-handler-decorator.js";
import { WebRTCService } from "./webrtc-service.js";
import type { IWebRTCService } from "../interfaces/services/webrtc-service.js";
import { ServiceLocator } from "./service-locator.js";
import type { IEventBusService } from "../interfaces/services/event-bus-service.js";
import { EventBusService } from "./event-bus-service.js";
import type { IEventProcessorService } from "../interfaces/services/event-processor-service.js";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

export class EventProcessorService implements IEventProcessorService {
  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;
  private webrtcService: IWebRTCService | null = null;
  private readonly eventBus: IEventBusService;

  constructor(
    eventBus: IEventBusService = ServiceLocator.get(EventBusService)
  ) {
    this.eventBus = eventBus;
    this.localQueue = new EventQueueService<LocalEvent>();
    this.remoteQueue = new EventQueueService<RemoteEvent>();
  }

  public initialize(): void {
    this.webrtcService = ServiceLocator.get<IWebRTCService>(WebRTCService);
    this.webrtcService.registerCommandHandlers(this);
    console.log("Event processor service initialized");
  }

  public getLocalQueue(): EventQueueService<LocalEvent> {
    return this.localQueue;
  }

  public getRemoteQueue(): EventQueueService<RemoteEvent> {
    return this.remoteQueue;
  }

  public addLocalEvent(event: LocalEvent) {
    console.log(`Added local event ${EventType[event.getType()]}`, event);
    this.localQueue.addEvent(event);
    this.eventBus.emit("localEvent", event);
  }

  @PeerCommandHandler(WebRTCType.EventData)
  public handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader) {
    if (webrtcPeer.getPlayer()?.isHost() === false) {
      return console.warn("Received event from non-host player");
    }

    const eventTypeId = binaryReader.unsignedInt8();
    const eventData = binaryReader.bytesAsArrayBuffer();

    const event = new RemoteEvent(eventTypeId);
    event.setData(eventData);

    this.remoteQueue.addEvent(event);
    this.eventBus.emit("remoteEvent", event);
  }

  public sendEvent(event: RemoteEvent) {
    console.log(`Sending remote event ${EventType[event.getType()]}`, event);

    this.getWebRTCService()
      .getPeers()
      .forEach((webrtcPeer) => {
        if (webrtcPeer.hasJoined()) {
          this.sendEventToPeer(webrtcPeer, event);
        }
      });
  }

  private getWebRTCService(): IWebRTCService {
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
