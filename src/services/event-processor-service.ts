import { EventType } from "../enums/event-type.js";
import { GameController } from "../models/game-controller.js";
import { RemoteEvent } from "../models/remote-event.js";
import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { WebRTCService } from "./webrtc-service.js";
import { LocalEvent } from "../models/local-event.js";
import { GameEvent } from "../interfaces/event/game-event.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class EventProcessorService {
  private webrtcService: WebRTCService;

  private localEvents: LocalEvent[] = [];
  private remoteEvents: RemoteEvent[] = [];

  private lastConsumedEvent: string | null = null;

  constructor(gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
  }

  public addLocalEvent(event: LocalEvent) {
    console.log(`Added local event ${EventType[event.getId()]}`, event);
    this.localEvents.push(event);
  }

  public listenLocalEvent<T>(eventId: EventType, callback: (data: T) => void) {
    this.localEvents.forEach((event) => {
      if (event.getId() === eventId) {
        console.log(`Local event ${EventType[eventId]} consumed`, event);
        this.lastConsumedEvent = EventType[eventId];
        callback(event.getPayload() as T);
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
      if (event.getId() === eventId) {
        console.log(`Remote event ${EventType[eventId]} consumed`, event);
        this.lastConsumedEvent = EventType[eventId];
        callback(event.getBuffer());
        this.removeEvent(this.remoteEvents, event);
      }
    });
  }

  public sendEvent(event: RemoteEvent) {
    console.log(`Sending remote event ${EventType[event.getId()]}`, event);
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
      24,
      context.canvas.height - 24,
      `Event: ${eventName}`,
      false,
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
    const id = event.getId();
    const data = event.getBuffer();

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
