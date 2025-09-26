import { injectable } from "@needle-di/core";
import { RemoteEvent } from "@engine/models/events/remote-event.js";
import { LocalEvent } from "@engine/models/events/local-event.js";
import { type EventIdentifierResolver, type EngineEventId } from "../../contracts/events/event-identifier.js";
import type { EngineWebRTCPeer } from "../../contracts/network/webrtc-peer.js";
import type { IEventProcessorService } from "../../contracts/gameplay/event-processor-service-interface.js";
import type { EventQueueServiceContract } from "../../contracts/gameplay/event-queue-service-interface.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export type EventSubscription = {
  eventType: EngineEventId;
  eventCallback: (data: unknown) => void;
};

@injectable()
export class EventProcessorService implements IEventProcessorService {
  private readonly eventNameResolver: EventIdentifierResolver | null;
  private networkEventSender: ((event: RemoteEvent) => void) | null = null;

  constructor(
    private readonly localQueue: EventQueueServiceContract<LocalEvent>,
    private readonly remoteQueue: EventQueueServiceContract<RemoteEvent>,
    eventNameResolver: EventIdentifierResolver | null = null
  ) {
    this.eventNameResolver = eventNameResolver;
  }

  public registerNetworkEventSender(sender: (event: RemoteEvent) => void): void {
    if (this.networkEventSender !== null) {
      throw new Error("EventProcessorService network sender has already been registered");
    }

    this.networkEventSender = sender;
  }

  public getLocalQueue(): EventQueueServiceContract<LocalEvent> {
    return this.localQueue;
  }

  public getRemoteQueue(): EventQueueServiceContract<RemoteEvent> {
    return this.remoteQueue;
  }

  public addLocalEvent(event: LocalEvent): void {
    console.log(`Added local event ${this.describeEvent(event.getType())}`, event);
    this.localQueue.addEvent(event);
  }

  public handleEventData(webrtcPeer: EngineWebRTCPeer, binaryReader: BinaryReader) {
    const eventTypeId = binaryReader.unsignedInt8();

    if (!webrtcPeer.isHost()) {
      console.warn("Received event from non-host player", {
        eventId: eventTypeId,
        eventName: this.describeEvent(eventTypeId),
      });
      return;
    }

    const eventData = binaryReader.bytesAsArrayBuffer();

    const event = new RemoteEvent(eventTypeId);
    event.setData(eventData);

    this.remoteQueue.addEvent(event);
  }

  public sendEvent(event: RemoteEvent): void {
    console.log(`Sending remote event ${this.describeEvent(event.getType())}`, event);

    if (this.networkEventSender === null) {
      console.warn("No network sender configured for EventProcessorService");
      return;
    }

    this.networkEventSender(event);
  }

  private describeEvent(eventType: EngineEventId): string {
    return this.eventNameResolver?.getName(eventType) ?? `Event(${eventType})`;
  }

}
