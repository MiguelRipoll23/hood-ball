import { WebRTCType } from "../../../engine/enums/webrtc-type.js";
import { PeerCommandHandler } from "../../../engine/decorators/peer-command-handler-decorator.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import type { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { RemoteEvent } from "../../../engine/models/remote-event.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

/**
 * WebRTCEventDispatcher — Dispatches WebRTC EventData messages into the engine event system.
 *
 * This game-layer adapter receives raw WebRTC EventData from peers and
 * dispatches them into the engine's remote event queue, decoupling the
 * engine's EventProcessorService from WebRTC protocol knowledge.
 *
 * Registered as a peer command handler on the WebRTC service.
 */
export class WebRTCEventDispatcher {
  constructor(private readonly eventProcessorService: EventProcessorService) {}

  /**
   * Register this dispatcher as a command handler on the WebRTC service.
   */
  public register(webRTCService: { registerCommandHandlers: (instance: object) => void }): void {
    webRTCService.registerCommandHandlers(this);
    EngineLogger.info("WebRTCEventDispatcher", "Registered");
  }

  @PeerCommandHandler(WebRTCType.EventData)
  public handleEventData(webrtcPeer: WebRTCPeer, binaryReader: BinaryReader): void {
    // Security: only accept events from verified hosts.
    // Use !== true so that undefined players (getPlayer() returns null/undefined)
    // are also rejected rather than silently falling through.
    if (webrtcPeer.getPlayer()?.isHost() !== true) {
      EngineLogger.warn("WebRTCEventDispatcher", "Received event from non-host or unknown player, dropping");
      return;
    }

    const eventTypeId = binaryReader.unsignedInt8();
    const eventData = binaryReader.bytesAsArrayBuffer();

    const event = new RemoteEvent(eventTypeId);
    event.setData(eventData);

    this.eventProcessorService.getRemoteQueue().addEvent(event);
  }
}
