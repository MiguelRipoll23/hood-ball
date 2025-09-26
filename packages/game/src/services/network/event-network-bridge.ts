import { injectable } from "@needle-di/core";
import { EventProcessorService } from "@engine/services/events/event-processor-service.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import type { WebRTCCommandMap } from "@engine/contracts/network/webrtc-command-map.js";
import { WebRTCService } from "./webrtc-service.js";
import { WebSocketService } from "./websocket-service.js";
import type { RemoteEvent } from "@engine/models/events/remote-event.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";
import { GameState } from "../../state/game-state.js";
import { EventType } from "../../enums/event-type.js";
import { LocalEvent } from "@engine/models/events/local-event.js";

@injectable()
export class EventNetworkBridge {
  private initialized = false;
  private webSocketListener: ((event: LocalEvent<unknown>) => void) | null = null;

  private readonly broadcastEvent = (event: RemoteEvent): void => {
    if (!this.gameState.getMatch()?.isHost()) {
      const eventDetails = {
        eventId: event.getType(),
        eventName: this.getEventName(event),
      };

      console.warn("Ignoring remote event broadcast from non-host client", eventDetails);
      return;
    }

    this.webRtcService
      .getPeers()
      .forEach((peer) => {
        if (peer.hasJoined()) {
          this.sendEventToPeer(peer, event);
        }
      });
  };

  private readonly handleWebRtcEventData = (peer: WebRTCPeer, reader: BinaryReader): void => {
    this.eventProcessorService.handleEventData(peer, reader);
  };

  constructor(
    private readonly eventProcessorService: EventProcessorService,
    private readonly webRtcService: WebRTCService,
    private readonly webSocketService: WebSocketService,
    private readonly webRtcCommands: WebRTCCommandMap,
    private readonly gameState: GameState
  ) {}

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.eventProcessorService.registerNetworkEventSender(this.broadcastEvent);

    this.webRtcService.registerCommandHandlers(this.eventProcessorService);
    this.webRtcService.bindCommandHandler(
      this.webRtcCommands.eventData,
      this.handleWebRtcEventData,
      "EventData"
    );

    this.webSocketListener = (event) => {
      this.eventProcessorService.addLocalEvent(event);
    };

    this.webSocketService.addLocalEventListener(this.webSocketListener);
    this.initialized = true;
  }

  public dispose(): void {
    if (!this.initialized || this.webSocketListener === null) {
      return;
    }

    this.webSocketService.removeLocalEventListener(this.webSocketListener);
    this.webSocketListener = null;
    this.initialized = false;
  }

  private sendEventToPeer(peer: WebRTCPeer, event: RemoteEvent): void {
    const eventTypeId = event.getType();
    const eventData = event.getData() ?? new ArrayBuffer(0);

    const payload = BinaryWriter.build()
      .unsignedInt8(this.webRtcCommands.eventData)
      .unsignedInt8(eventTypeId)
      .arrayBuffer(eventData)
      .toArrayBuffer();

    peer.sendReliableOrderedMessage(payload);
  }

  private getEventName(event: RemoteEvent): string {
    const eventTypeId = event.getType();
    const eventName = (EventType as unknown as Record<number, string>)[eventTypeId];
    return eventName ?? `Event(${eventTypeId})`;
  }
}
