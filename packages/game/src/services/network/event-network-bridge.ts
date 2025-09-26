import { inject, injectable } from "@needle-di/core";
import { EventProcessorService } from "@engine/services/events/event-processor-service.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import { WEBRTC_COMMAND_MAP_TOKEN, type WebRTCCommandMap } from "@engine/contracts/network/webrtc-command-map.js";
import { WebRTCService } from "./webrtc-service.js";
import { WebSocketService } from "./websocket-service.js";
import type { RemoteEvent } from "@engine/models/events/remote-event.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";
import { GameState } from "../../state/game-state.js";
import { EventType } from "../../enums/event-type.js";

@injectable()
export class EventNetworkBridge {
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
    private readonly eventProcessorService: EventProcessorService = inject(EventProcessorService),
    private readonly webRtcService: WebRTCService = inject(WebRTCService),
    private readonly webSocketService: WebSocketService = inject(WebSocketService),
    private readonly webRtcCommands: WebRTCCommandMap = inject(WEBRTC_COMMAND_MAP_TOKEN),
    private readonly gameState: GameState = inject(GameState)
  ) {
    this.eventProcessorService.registerNetworkEventSender(this.broadcastEvent);

    this.webRtcService.registerCommandHandlers(this.eventProcessorService);
    this.webRtcService.bindCommandHandler(
      this.webRtcCommands.eventData,
      this.handleWebRtcEventData,
      "EventData"
    );

    this.webSocketService.addLocalEventListener((event) => {
      this.eventProcessorService.addLocalEvent(event);
    });
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
