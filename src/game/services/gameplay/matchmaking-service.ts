import { GameState } from "../../../core/models/game-state.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { SaveUserScoresRequest } from "../../interfaces/requests/save-score-request.js";
import { DebugUtils } from "../../../core/utils/debug-utils.js";
import { WebSocketService } from "../network/websocket-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import { APIService } from "../network/api-service.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { IntervalManagerService } from "../../../core/services/gameplay/interval-manager-service.js";
import { MatchFinderService } from "./match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import { GamePlayer } from "../../models/game-player.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
  PendingDisconnectionsToken,
} from "./matchmaking-tokens.js";
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
  private readonly pendingDisconnections: Set<string>;
  private readonly timerManagerService: TimerManagerService;
  private gameOverFinalized: boolean = false;
  private gameOverInProgress: boolean = false;

  constructor(private gameState = container.get(GameState)) {
    this.timerManagerService = container.get(TimerManagerService);
    container.get(IntervalManagerService);
    this.apiService = container.get(APIService);
    this.webSocketService = container.get(WebSocketService);
    this.webrtcService = container.get(WebRTCService);
    container.get(EventProcessorService);
    this.matchFinderService = container.get(MatchFinderService);
    this.networkService = container.get(MatchmakingNetworkService);
    this.pendingDisconnections = container.get(PendingDisconnectionsToken);
    this.registerCommandHandlers();

    const eventConsumerService = container.get(EventConsumerService);
    eventConsumerService.subscribeToLocalEvent(
      EventType.PlayerDisconnected,
      () => {
        if (this.gameOverInProgress) {
          this.finalizeIfNoPendingDisconnections();
        }
      }
    );
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

    const savePlayerScoresRequest: SaveUserScoresRequest[] = [];

    players.forEach((player: GamePlayer) => {
      const playerId = player.getId();
      const totalScore = player.getScore();

      savePlayerScoresRequest.push({
        userId: playerId,
        totalScore,
      });
    });

    await this.apiService.saveScore(savePlayerScoresRequest);
  }

  public async handleGameOver(): Promise<void> {
    this.gameOverFinalized = false; // Reset the flag for new game over
    this.gameOverInProgress = true;

    if (this.gameState.getMatch()?.isHost()) {
      const peers = this.webrtcService.getPeers();

      this.pendingDisconnections.clear();
      peers.forEach((peer) => {
        const playerId = peer.getPlayer()?.getId();
        if (playerId) {
          this.pendingDisconnections.add(playerId);
        }

        peer.disconnectGracefully();
      });

      this.networkService.removePingCheckInterval();

      await this.apiService
        .removeMatch()
        .catch((error) => console.error(error));

      // Add a timeout to force finalize if disconnections don't complete
      this.timerManagerService.createTimer(3, () => {
        console.warn("Game over timeout reached, forcing finalization");
        this.pendingDisconnections.clear();
        this.finalizeGameOver();
      });

      this.finalizeIfNoPendingDisconnections();
    } else {
      this.finalizeGameOver();
    }
  }

  public finalizeIfNoPendingDisconnections(): void {
    console.log(
      `Checking pending disconnections: ${this.pendingDisconnections.size} remaining`
    );

    if (this.pendingDisconnections.size === 0) {
      console.log("No pending disconnections, finalizing game over");
      this.finalizeGameOver();
    } else {
      console.log(
        "Still waiting for pending disconnections:",
        Array.from(this.pendingDisconnections)
      );
    }
  }

  private finalizeGameOver(): void {
    if (this.gameOverFinalized) {
      console.log("Game over already finalized, skipping");
      return;
    }

    this.gameOverFinalized = true;
    this.gameOverInProgress = false;
    this.gameState.setMatch(null);
    container.get(PendingIdentitiesToken).clear();
    container.get(ReceivedIdentitiesToken).clear();
    const localEvent = new LocalEvent(EventType.ReturnToMainMenu);
    container.get(EventProcessorService).addLocalEvent(localEvent);
    console.log("Game over finalized, returning to main menu");
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
