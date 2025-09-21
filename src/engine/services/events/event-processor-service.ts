import { inject, injectable } from "@needle-di/core";
import { RemoteEvent } from "../../../core/models/remote-event.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { EventQueueService } from "./event-queue-service.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN, type EventIdentifierResolver, type EngineEventId } from "../../contracts/events/event-identifier.js";
import { WEBRTC_COMMAND_MAP_TOKEN, type WebRTCCommandMap } from "../../contracts/network/webrtc-command-map.js";
import { ENGINE_WEBRTC_SERVICE_TOKEN } from "./event-tokens.js";
import type { EngineWebRTCService } from "../../contracts/network/webrtc-service.js";
import type { EngineWebRTCPeer } from "../../contracts/network/webrtc-peer.js";
import type { IEventProcessorService } from "../../contracts/gameplay/event-processor-service-interface.js";
import type { EventQueueServiceContract } from "../../contracts/gameplay/event-queue-service-interface.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export type EventSubscription = {
  eventType: EngineEventId;
  eventCallback: (data: unknown) => void;
};

@injectable()
export class EventProcessorService implements IEventProcessorService {
  private readonly localQueue = new EventQueueService<LocalEvent>();
  private readonly remoteQueue = new EventQueueService<RemoteEvent>();
  private readonly webrtcService: EngineWebRTCService;
  private readonly eventNameResolver: EventIdentifierResolver | undefined;
  private readonly webRtcCommands: WebRTCCommandMap;

  constructor() {
    this.webrtcService = inject(ENGINE_WEBRTC_SERVICE_TOKEN) as EngineWebRTCService;
    this.eventNameResolver = inject(EVENT_IDENTIFIER_RESOLVER_TOKEN, { optional: true }) as EventIdentifierResolver | undefined;
    this.webRtcCommands = inject(WEBRTC_COMMAND_MAP_TOKEN) as WebRTCCommandMap;
    this.webrtcService.registerCommandHandlers(this);
    this.webrtcService.bindCommandHandler(
      this.webRtcCommands.eventData,
      this.handleEventData.bind(this),
      "EventData"
    );
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
    if (!webrtcPeer.isHost()) {
      console.warn("Received event from non-host player");
      return;
    }

    const eventTypeId = binaryReader.unsignedInt8();
    const eventData = binaryReader.bytesAsArrayBuffer();

    const event = new RemoteEvent(eventTypeId);
    event.setData(eventData);

    this.remoteQueue.addEvent(event);
  }

  public sendEvent(event: RemoteEvent): void {
    console.log(`Sending remote event ${this.describeEvent(event.getType())}`, event);

    this.webrtcService
      .getPeers()
      .forEach((webrtcPeer) => {
        if (webrtcPeer.hasJoined()) {
          this.sendEventToPeer(webrtcPeer, event);
        }
      });
  }

  private describeEvent(eventType: EngineEventId): string {
    return (
      this.eventNameResolver?.getName(eventType) ?? `Event(${eventType})`
    );
  }

  private sendEventToPeer(webrtcPeer: EngineWebRTCPeer, event: RemoteEvent): void {
    const eventTypeId = event.getType();
    const eventData = event.getData();

    const payload = BinaryWriter.build()
      .unsignedInt8(this.webRtcCommands.eventData)
      .unsignedInt8(eventTypeId)
      .arrayBuffer(eventData ?? new ArrayBuffer(0))
      .toArrayBuffer();

    webrtcPeer.sendReliableOrderedMessage(payload);
  }
}

