import { EventType } from "../enums/event-type.js";
import { GameController } from "../models/game-controller.js";
import { RemoteEvent } from "../models/remote-event.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCService } from "./webrtc-service.js";
import { LocalEvent } from "../models/local-event.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { EventQueueService } from "./event-queue-service.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import type { BinaryReader } from "../utils/binary-reader-utils.js";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

export class EventProcessorService {
  private webrtcService: WebRTCService;

  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;

  private lastConsumedEvent: string | null = null;

  constructor(gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
    this.localQueue = new EventQueueService<LocalEvent>();
    this.remoteQueue = new EventQueueService<RemoteEvent>();
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
  }

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
    this.webrtcService.getPeers().forEach((webrtcPeer) => {
      if (webrtcPeer.hasJoined()) {
        this.sendEventToPeer(webrtcPeer, event);
      }
    });
  }

  public setLastConsumedEvent(eventType: EventType) {
    this.lastConsumedEvent = EventType[eventType];
  }

  public renderDebugInformation(context: CanvasRenderingContext2D) {
    let text = "No event";

    if (this.lastConsumedEvent) {
      text = `Event: ${this.lastConsumedEvent}`;
    }

    DebugUtils.renderText(
      context,
      context.canvas.width - 24,
      context.canvas.height - 48,
      text,
      true,
      true
    );
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
