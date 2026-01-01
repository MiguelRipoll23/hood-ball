import { inject, injectable } from "@needle-di/core";
import { MatchStateType } from "../../enums/match-state-type.js";
import { DebugUtils } from "../../../engine/utils/debug-utils.js";
import { WebSocketService } from "../network/websocket-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import type { MatchmakingNetworkServiceContract } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { MatchLifecycleService } from "./match-lifecycle-service.js";
import { MatchSessionService } from "../session/match-session-service.js";

@injectable()
export class MatchmakingService implements MatchmakingServiceContract {
  constructor(
    private readonly webSocketService = inject(WebSocketService),
    private readonly webrtcService = inject(WebRTCService),
    private readonly matchFinderService = inject(MatchFinderService),
    private readonly networkService: MatchmakingNetworkServiceContract = inject(
      MatchmakingNetworkService
    ),
    private readonly lifecycleService = inject(MatchLifecycleService),
    private readonly matchSessionService = inject(MatchSessionService)
  ) {
    this.registerCommandHandlers();
  }

  public getNetworkService(): MatchmakingNetworkServiceContract {
    return this.networkService;
  }

  private registerCommandHandlers(): void {
    this.webSocketService.registerCommandHandlers(this.networkService);
    this.webrtcService.registerCommandHandlers(this.networkService);
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
