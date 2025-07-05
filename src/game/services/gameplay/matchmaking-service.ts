import { GameState } from "../../../core/models/game-state.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { SavePlayerScoresRequest } from "../../interfaces/requests/save-score-request.js";
import { DebugUtils } from "../../../core/utils/debug-utils.js";
import { WebSocketService } from "../network/websocket-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { APIService } from "../network/api-service.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { IntervalManagerService } from "../../../core/services/gameplay/interval-manager-service.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import { GamePlayer } from "../../models/game-player.js";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";
import type { IMatchmakingNetworkService } from "../../interfaces/services/network/matchmaking-network-service-interface.js";
import { injectable } from "@needle-di/core";
import { container } from "../../../core/services/di-container.js";

@injectable()
export class MatchmakingService implements IMatchmakingService {
  private readonly apiService: APIService;
  private readonly webSocketService: WebSocketService;
  private readonly webrtcService: WebRTCService;
  private readonly matchFinderService: MatchFinderService;
  private readonly networkService: IMatchmakingNetworkService;

  constructor(private gameState = container.get(GameState)) {
    container.get(TimerManagerService);
    container.get(IntervalManagerService);
    this.apiService = container.get(APIService);
    this.webSocketService = container.get(WebSocketService);
    this.webrtcService = container.get(WebRTCService);
    container.get(EventProcessorService);
    this.matchFinderService = container.get(MatchFinderService);
    this.networkService = container.get(MatchmakingNetworkService);
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
    const matches = await this.matchFinderService.findMatches();

    if (matches.length === 0) {
      console.log("No matches found");
      await this.matchFinderService.createAndAdvertiseMatch();
      this.networkService.startPingCheckInterval();
      return;
    }

    await this.matchFinderService.joinMatches(matches);

    await new Promise<void>((resolve) => {
      this.networkService.startFindMatchesTimer(() => resolve());
    });

    await this.matchFinderService.createAndAdvertiseMatch();
    this.networkService.startPingCheckInterval();
  }

  public async savePlayerScore(): Promise<void> {
    const players = this.gameState.getMatch()?.getPlayers();

    if (players === undefined || players.length === 0) {
      console.warn("No players in the match to save score");
      return;
    }

    const savePlayerScoresRequest: SavePlayerScoresRequest[] = [];

    players.forEach((player: GamePlayer) => {
      const playerId = player.getId();
      const playerName = player.getName();
      const score = player.getScore();

      savePlayerScoresRequest.push({
        playerId,
        playerName,
        score,
      });
    });

    await this.apiService.saveScore(savePlayerScoresRequest);
  }

  public async handleGameOver(): Promise<void> {
    if (this.gameState.getMatch()?.isHost()) {
      this.webrtcService
        .getPeers()
        .forEach((peer) => peer.disconnectGracefully());

      this.networkService.removePingCheckInterval();

      await this.apiService
        .removeMatch()
        .catch((error) => console.error(error));
    }

    this.gameState.setMatch(null);
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
