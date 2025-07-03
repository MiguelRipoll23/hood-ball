import { ServiceLocator } from "../service-locator.js";
import { EventProcessorService } from "./event-processor-service.js";
import { LocalEvent } from "../../models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchmakingService } from "./matchmaking-service.js";
import type { IMatchmakingProvider } from "../../interfaces/services/matchmaking-provider.js";

export class MatchmakingControllerService {
  private readonly matchmakingService: IMatchmakingProvider;
  private readonly eventProcessor: EventProcessorService;

  constructor(
    matchmakingService: IMatchmakingProvider = ServiceLocator.get(MatchmakingService),
    eventProcessor: EventProcessorService = ServiceLocator.get(EventProcessorService),
  ) {
    this.matchmakingService = matchmakingService;
    this.eventProcessor = eventProcessor;
  }

  public async startMatchmaking(): Promise<void> {
    this.eventProcessor.addLocalEvent(new LocalEvent(EventType.MatchmakingStarted));
    await this.matchmakingService.findOrAdvertiseMatch();
  }
}
