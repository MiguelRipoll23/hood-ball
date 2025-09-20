import { inject, injectable } from "@needle-di/core";
import { WebRTCService } from "../network/webrtc-service.js";
import { MatchmakingService } from "./matchmaking-service.js";

@injectable()
export class MatchmakingCoordinator {
  constructor(
    private readonly webrtcService = inject(WebRTCService),
    private readonly matchmakingService = inject(MatchmakingService)
  ) {
    this.webrtcService.setConnectionListener(
      this.matchmakingService.getNetworkService()
    );
  }
}
