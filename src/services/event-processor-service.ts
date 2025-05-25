import { EventType } from "../enums/event-type.js";
import { GameController } from "../models/game-controller.js";
import { RemoteEvent } from "../models/remote-event.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCService } from "./webrtc-service.js";
import { LocalEvent } from "../models/local-event.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { EventQueue } from "../models/event-queue.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

export class EventProcessorService {
  private webrtcService: WebRTCService;

  private localQueue: EventQueue<LocalEvent>;
  private remoteQueue: EventQueue<RemoteEvent>;

  private lastConsumedEvent: string | null = null;

  constructor(gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
    this.localQueue = new EventQueue<LocalEvent>();
    this.remoteQueue = new EventQueue<RemoteEvent>();
  }

  public getLocalQueue(): EventQueue<LocalEvent> {
    return this.localQueue;
  }

  public getRemoteQueue(): EventQueue<RemoteEvent> {
    return this.remoteQueue;
  }

  public addLocalEvent(event: LocalEvent) {
    console.log(`Added local event ${EventType[event.getType()]}`, event);
    this.localQueue.addEvent(event);
  }

  public handleEventData(webrtcPeer: WebRTCPeer, data: ArrayBuffer | null) {
    if (data === null) {
      return console.warn("Received null data from peer");
    }

    if (webrtcPeer.getPlayer()?.isHost() === false) {
      return console.warn("Received event from non-host player");
    }

    const dataView = new DataView(data);

    const id = dataView.getInt8(0);
    const payload = data.byteLength > 1 ? data.slice(1) : null;

    const event = new RemoteEvent(id);
    event.setArrayBuffer(payload);

    this.remoteQueue.addEvent(event);
  }

  public sendEvent(event: RemoteEvent) {
    console.log(`Sending remote event ${event.getType()}`, event);
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
    const eventData = event.getArrayBuffer();

    const payload = BinaryWriter.build()
      .unsignedInt8(WebRTCType.EventData)
      .unsignedInt8(eventTypeId)
      .arrayBuffer(eventData ?? new ArrayBuffer(0))
      .toArrayBuffer();

    webrtcPeer.sendReliableOrderedMessage(payload);
  }
}
