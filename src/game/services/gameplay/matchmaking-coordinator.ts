import { inject, injectable } from "@needle-di/core";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { MatchmakingService } from "./matchmaking-service.js";

@injectable()
export class MatchmakingCoordinator {
  constructor(
    private readonly webrtcService = inject(WebRTCService),
    private readonly matchmakingService = inject(MatchmakingService),
    private readonly eventProcessor = inject(EventProcessorService)
  ) {}

  public initialize(): void {
    this.eventProcessor.initialize(this.webrtcService);
    this.webrtcService.initialize(this.matchmakingService.getNetworkService());
  }
}
