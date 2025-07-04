import { EventType } from "../../enums/event-type.js";
import { RemoteEvent } from "./remote-event.js";
import type { WebRTCPeer } from "../../interfaces/webrtc-peer.js";
import { LocalEvent } from "./local-event.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { EventQueueService } from "./event-queue-service.js";
import type { IEventProcessorService } from "../../interfaces/services/gameplay/event-processor-service-interface.js";
import type { IEventQueueService } from "../../interfaces/services/gameplay/event-queue-service-interface.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import type { IWebRTCService } from "../../interfaces/services/network/webrtc-service-interface.js";
import { injectable } from "@needle-di/core";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

@injectable()
export class EventProcessorService implements IEventProcessorService {
  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;
  private webrtcService: IWebRTCService | null = null;

  constructor() {
    this.localQueue = new EventQueueService<LocalEvent>();
    this.remoteQueue = new EventQueueService<RemoteEvent>();
  }

  public initialize(webrtcService: IWebRTCService): void {
    this.webrtcService = webrtcService;
    this.webrtcService.registerCommandHandlers(this);
    console.log("Event processor service initialized");
  }

  public getLocalQueue(): IEventQueueService<LocalEvent> {
    return this.localQueue;
  }

  public getRemoteQueue(): IEventQueueService<RemoteEvent> {
    return this.remoteQueue;
  }

  public addLocalEvent(event: LocalEvent) {
    console.log(`Added local event ${EventType[event.getType()]}`, event);
    this.localQueue.addEvent(event);
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
