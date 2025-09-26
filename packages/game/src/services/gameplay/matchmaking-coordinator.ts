import { injectable } from "@needle-di/core";
import { WebRTCService } from "../network/webrtc-service.js";
import { MatchmakingService } from "./matchmaking-service.js";

@injectable()
export class MatchmakingCoordinator {
  private initialized = false;

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly matchmakingService: MatchmakingService
  ) {}

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.webrtcService.setConnectionListener(
      this.matchmakingService.getNetworkService()
    );
    this.initialized = true;
  }
}
