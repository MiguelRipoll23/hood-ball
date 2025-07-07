import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchmakingService } from "./matchmaking-service.js";
import { container } from "../../../core/services/di-container.js";
import { injectable } from "@needle-di/core";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";

@injectable()
export class MatchmakingControllerService {
  private readonly matchmakingService: IMatchmakingService;
  private readonly eventProcessor: EventProcessorService;

  constructor(
    matchmakingService: IMatchmakingService = container.get(MatchmakingService),
    eventProcessor: EventProcessorService = container.get(EventProcessorService)
  ) {
    this.matchmakingService = matchmakingService;
    this.eventProcessor = eventProcessor;
  }

  public async startMatchmaking(): Promise<void> {
    this.eventProcessor.addLocalEvent(
      new LocalEvent(EventType.MatchmakingStarted)
    );
    await this.matchmakingService.findOrAdvertiseMatch();
  }
}
