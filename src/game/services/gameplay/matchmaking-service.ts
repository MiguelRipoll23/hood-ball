import { inject, injectable } from "@needle-di/core";
import { GameState } from "../../../core/models/game-state.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { DebugUtils } from "../../../core/utils/debug-utils.js";
import { WebSocketService } from "../network/websocket-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import type { IMatchmakingNetworkService } from "../../interfaces/services/network/matchmaking-network-service-interface.js";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";
import { MatchLifecycleService } from "./match-lifecycle-service.js";

@injectable()
export class MatchmakingService implements IMatchmakingService {
  constructor(
    private readonly gameState = inject(GameState),
    private readonly webSocketService = inject(WebSocketService),
    private readonly webrtcService = inject(WebRTCService),
    private readonly matchFinderService = inject(MatchFinderService),
    private readonly networkService: IMatchmakingNetworkService = inject(
      MatchmakingNetworkService
    ),
    private readonly lifecycleService = inject(MatchLifecycleService)
  ) {
    this.registerCommandHandlers();
  }

  public getNetworkService(): IMatchmakingNetworkService {
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
      await this.matchFinderService.createAndAdvertiseMatch();
      this.networkService.startPingCheckInterval();
      this.networkService.startAdvertiseMatchInterval();
      return;
    }

    await this.matchFinderService.joinMatches(matches);

    await new Promise<void>((resolve) => {
      this.networkService.startFindMatchesTimer(() => resolve());
    });

    await this.matchFinderService.createAndAdvertiseMatch();
    this.networkService.startPingCheckInterval();
    this.networkService.startAdvertiseMatchInterval();
  }

  public async savePlayerScore(): Promise<void> {
    await this.lifecycleService.savePlayerScore();
  }

  public async handleGameOver(): Promise<void> {
    await this.lifecycleService.handleGameOver();
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    const match = this.gameState.getMatch();
    if (match === null) {
      return;
    }
    const state = match.getState();
    DebugUtils.renderText(context, 24, 24, `State: ${MatchStateType[state]}`);
  }
}
