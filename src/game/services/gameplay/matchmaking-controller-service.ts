import { inject, injectable } from "@needle-di/core";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { EventType } from "../../../engine/enums/event-type.js";
import { MatchmakingService } from "./matchmaking-service.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { MatchmakingControllerContract } from "../../interfaces/services/gameplay/matchmaking-controller-contract-interface.js";

@injectable()
export class MatchmakingControllerService
  implements MatchmakingControllerContract
{
  constructor(
    private readonly matchmakingService: MatchmakingServiceContract = inject(
      MatchmakingService
    ),
    private readonly eventProcessor: EventProcessorService = inject(
      EventProcessorService
    )
  ) {}

  public async startMatchmaking(): Promise<void> {
    this.eventProcessor.addLocalEvent(
      new LocalEvent(EventType.MatchmakingStarted)
    );
    await this.matchmakingService.findOrAdvertiseMatch();
  }
}
