import { EventType } from "../enums/event-type.js";
import { GameController } from "../models/game-controller.js";
import { RemoteEvent } from "../models/remote-event.js";
import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCService } from "./webrtc-service.js";
import { LocalEvent } from "../models/local-event.js";
import { GameEvent } from "../interfaces/event/game-event.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { DebugUtils } from "../utils/debug-utils.js";
import { EventsConsumer } from "./events-consumer-service.js";
import { LocalEventsQueueService } from "./local-events-queue-service.js";
import { RemoteEventsQueueService } from "./remote-events-queue-service.js";

export type EventSubscription = {
  eventType: EventType;
  eventCallback: (data: unknown) => void;
};

export class EventProcessorService {
  private webrtcService: WebRTCService;

  private localQueue: LocalEventsQueueService;
  private remoteQueue: RemoteEventsQueueService;

  private localEvents: LocalEvent[] = [];
  private remoteEvents: RemoteEvent[] = [];

  private lastConsumedEvent: string | null = null;

  constructor(gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
    this.localQueue = new LocalEventsQueueService();
    this.remoteQueue = new RemoteEventsQueueService();
  }

  public createConsumer(): EventsConsumer {
    return new EventsConsumer();
  }

  public consumeEvents(consumer: EventsConsumer) {
    this.localQueue.consumeEvents(consumer);
    this.remoteQueue.consumeEvents(consumer);
  }

  public addLocalEvent(event: LocalEvent) {
    console.log(`Added local event ${EventType[event.getType()]}`, event);
    this.localQueue.addEvent(event);
    this.localEvents.push(event);
  }

  public listenLocalEvent<T>(eventId: EventType, callback: (data: T) => void) {
    this.localEvents.forEach((event) => {
      if (event.getType() === eventId) {
        console.log(`Local event ${EventType[eventId]} consumed`, event);
        this.lastConsumedEvent = EventType[eventId];
        callback(event.getData() as T);
        this.removeEvent(this.localEvents, event);
      }
    });
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
    event.setBuffer(payload);

    this.remoteEvents.push(event);
  }

  public listenRemoteEvent(
    eventId: EventType,
    callback: (data: ArrayBuffer | null) => void
  ) {
    this.remoteEvents.forEach((event) => {
      if (event.getType() === eventId) {
        console.log(`Remote event ${EventType[eventId]} consumed`, event);
        this.lastConsumedEvent = EventType[eventId];
        callback(event.getData());
        this.removeEvent(this.remoteEvents, event);
      }
    });
  }

  public sendEvent(event: RemoteEvent) {
    console.log(`Sending remote event ${EventType[event.getType()]}`, event);
    this.webrtcService.getPeers().forEach((webrtcPeer) => {
      if (webrtcPeer.hasJoined()) {
        this.sendEventToPeer(webrtcPeer, event);
      }
    });
  }

  public renderDebugInformation(context: CanvasRenderingContext2D) {
    const eventName = this.lastConsumedEvent ?? "none";

    DebugUtils.renderDebugText(
      context,
      context.canvas.width - 24,
      context.canvas.height - 48,
      `Last Event: ${eventName}`,
      true,
      true
    );
  }

  private removeEvent(list: GameEvent[], event: GameEvent) {
    const index = list.indexOf(event);

    if (index > -1) {
      list.splice(index, 1);
    }
  }

  private sendEventToPeer(webrtcPeer: WebRTCPeer, event: RemoteEvent) {
    const id = event.getType();
    const data = event.getData();

    const dataBytesLength = data?.byteLength ?? 0;

    const arrayBuffer = new ArrayBuffer(2 + dataBytesLength);

    const dataView = new DataView(arrayBuffer);
    dataView.setUint8(0, WebRTCType.EventData);
    dataView.setUint8(1, id);

    if (data) {
      new Uint8Array(arrayBuffer).set(new Uint8Array(data), 2);
    }

    webrtcPeer.sendReliableOrderedMessage(arrayBuffer);
  }
}
