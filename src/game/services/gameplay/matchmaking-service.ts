import { inject, injectable } from "@needle-di/core";
import { MatchStateType } from "../../enums/match-state-type.js";
import { DebugUtils } from "../../../engine/utils/debug-utils.js";
import { WEB_RTC_SERVICE_TOKEN, type WebRTCServiceContract } from "../../../engine/interfaces/services/network/webrtc-service-contract.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MATCHMAKING_NETWORK_SERVICE_TOKEN } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import type { MatchmakingNetworkServiceContract } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { MatchLifecycleService } from "./match-lifecycle-service.js";
import { MatchSessionService } from "../session/match-session-service.js";

@injectable()
export class MatchmakingService implements MatchmakingServiceContract {
  constructor(
    private readonly webrtcService: WebRTCServiceContract = inject(
      WEB_RTC_SERVICE_TOKEN,
    ),
    private readonly matchFinderService = inject(MatchFinderService),
    private readonly networkService: MatchmakingNetworkServiceContract = inject(
      MATCHMAKING_NETWORK_SERVICE_TOKEN
    ),
    private readonly lifecycleService = inject(MatchLifecycleService),
    private readonly matchSessionService = inject(MatchSessionService)
  ) {}

  public getNetworkService(): MatchmakingNetworkServiceContract {
    return this.networkService;
  }

  public async findOrAdvertiseMatch(): Promise<void> {
    const findMatchesResponse = await this.matchFinderService.findMatches();
    const matches = findMatchesResponse.results;

    if (matches.length === 0) {
      console.log("No matches found");
      this.setupAdvertiseCallback();
      await this.matchFinderService.createAndAdvertiseMatch();
      this.networkService.startPingCheckInterval();
      this.networkService.startMatchAdvertiseInterval();
      return;
    }

    await this.matchFinderService.joinMatches(matches);

    await new Promise<void>((resolve) => {
      this.networkService.startFindMatchesTimer(() => resolve());
    });

    this.setupAdvertiseCallback();
    await this.matchFinderService.createAndAdvertiseMatch();
    this.networkService.startPingCheckInterval();
    this.networkService.startMatchAdvertiseInterval();
  }

  private setupAdvertiseCallback(): void {
    this.matchSessionService.setAdvertiseCallback(() => {
      const match = this.matchSessionService.getMatch();
      if (match !== null && match.getState() !== MatchStateType.GameOver) {
        this.matchFinderService.advertiseMatch().catch((error: unknown) => {
          console.error("Failed to advertise match:", error);
        });
      }
    });
  }

  public async savePlayerScore(): Promise<void> {
    await this.lifecycleService.savePlayerScore();
  }

  public async handleGameOver(): Promise<void> {
    await this.lifecycleService.handleGameOver();
  }

  public async leaveMatch(): Promise<void> {
    await this.lifecycleService.leaveMatch();
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.matchSessionService.getMatch();
    if (match === null) {
      return;
    }
    const state = match.getState();
    DebugUtils.renderText(context, 24, 24, `State: ${MatchStateType[state]}`);

    // Delegate to webrtc service for its debug information
    this.webrtcService.renderDebugInformation(context);
  }
}
