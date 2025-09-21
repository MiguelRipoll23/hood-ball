import { inject, injectable } from "@needle-di/core";
import { EventProcessorService } from "@engine/services/events/event-processor-service.js";
import { LocalEvent } from "@core/models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchmakingService } from "./matchmaking-service.js";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";

@injectable()
export class MatchmakingControllerService {
  constructor(
    private readonly matchmakingService: IMatchmakingService = inject(
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

