import { inject, injectable } from "@needle-di/core";
import { EVENT_PROCESSOR_SERVICE_TOKEN, type EventProcessorServiceContract } from "../../../engine/interfaces/services/events/event-processor-service-contract.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { GameEventType } from "../../enums/event-type.js";
import { MATCHMAKING_SERVICE_TOKEN } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { MatchmakingControllerContract } from "../../interfaces/services/gameplay/matchmaking-controller-contract-interface.js";

@injectable()
export class MatchmakingControllerService
  implements MatchmakingControllerContract
{
  constructor(
    private readonly matchmakingService: MatchmakingServiceContract = inject(
      MATCHMAKING_SERVICE_TOKEN
    ),
    private readonly eventProcessor: EventProcessorServiceContract = inject(
      EVENT_PROCESSOR_SERVICE_TOKEN
    )
  ) {}

  public async startMatchmaking(): Promise<void> {
    this.eventProcessor.addLocalEvent(
      new LocalEvent(GameEventType.MatchmakingStarted)
    );
    await this.matchmakingService.findOrAdvertiseMatch();
  }
}
