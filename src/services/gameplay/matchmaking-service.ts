import { GameState } from "../../models/game-state.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { SavePlayerScoresRequest } from "../../interfaces/requests/save-score-request.js";
import { DebugUtils } from "../../debug/debug-utils.js";
import { WebSocketService } from "../network/websocket-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "./event-processor-service.js";
import { APIService } from "../network/api-service.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import type { IMatchmakingProvider } from "../../interfaces/services/matchmaking-provider.js";
import { injectable } from "@needle-di/core";
import { container } from "../di-container.js";

@injectable()
export class MatchmakingService implements IMatchmakingProvider {

  private pendingIdentities: Map<string, boolean>;
  private receivedIdentities: Map<
    string,
    { playerId: string; playerName: string }
  >;

  private readonly timerManagerService: TimerManagerService;
  private readonly intervalManagerService: IntervalManagerService;

  private readonly apiService: APIService;
  private readonly webSocketService: WebSocketService;
  private readonly webrtcService: WebRTCService;
  private readonly eventProcessorService: EventProcessorService;
  private readonly matchFinderService: MatchFinderService;
  private readonly networkService: MatchmakingNetworkService;

  constructor(private gameState = container.get(GameState)) {
    this.pendingIdentities = new Map();
    this.receivedIdentities = new Map();
    this.timerManagerService = container.get(TimerManagerService);
    this.intervalManagerService = container.get(IntervalManagerService);
    this.apiService = container.get(APIService);
    this.webSocketService = container.get(WebSocketService);
    this.webrtcService = container.get(WebRTCService);
    this.eventProcessorService = container.get(EventProcessorService);
    this.matchFinderService = new MatchFinderService(
      this.gameState,
      this.apiService,
      this.webSocketService,
      this.pendingIdentities,
      this.eventProcessorService,
    );
    this.networkService = new MatchmakingNetworkService(
      this.gameState,
      this.timerManagerService,
      this.intervalManagerService,
      this.webSocketService,
      this.webrtcService,
      this.eventProcessorService,
      this.matchFinderService,
      this.pendingIdentities,
      this.receivedIdentities,
    );
    this.registerCommandHandlers();
  }

  public getNetworkService(): MatchmakingNetworkService {
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
      return console.warn("No players in the match to save score");
    }

    const savePlayerScoresRequest: SavePlayerScoresRequest[] = [];

    players.forEach((player) => {
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
