import { EventProcessorService } from "../../core/services/event-processor-service.js";
import { LocalEvent } from "../../core/services/local-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchmakingService } from "./matchmaking-service.js";
import type { IMatchmakingProvider } from "../../interfaces/services/gameplay/matchmaking-provider.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class MatchmakingControllerService {
  private readonly matchmakingService: IMatchmakingProvider;
  private readonly eventProcessor: EventProcessorService;

  constructor(
    matchmakingService: IMatchmakingProvider = container.get(MatchmakingService),
    eventProcessor: EventProcessorService = container.get(EventProcessorService),
  ) {
    this.matchmakingService = matchmakingService;
    this.eventProcessor = eventProcessor;
  }

  public async startMatchmaking(): Promise<void> {
    this.eventProcessor.addLocalEvent(new LocalEvent(EventType.MatchmakingStarted));
    await this.matchmakingService.findOrAdvertiseMatch();
  }
}
