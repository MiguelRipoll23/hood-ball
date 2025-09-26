import { injectable } from "@needle-di/core";
import { LocalEvent } from "@engine/models/events/local-event.js";
import { EventType } from "@game/enums/event-type.js";
import type { EventProcessorService } from "@engine/services/events/event-processor-service.js";
import type { PlayerConnectedPayload } from "@game/interfaces/events/player-connected-payload.js";
import type { GamePlayer } from "@game/models/game-player.js";

@injectable()
export class MatchmakingEventPublisher {
  public publishPlayerConnected(
    eventProcessorService: EventProcessorService,
    player: GamePlayer,
    matchmaking: boolean
  ): void {
    const localEvent = new LocalEvent<PlayerConnectedPayload>(
      EventType.PlayerConnected
    );

    localEvent.setData({ player, matchmaking });
    eventProcessorService.addLocalEvent(localEvent);
  }
}
