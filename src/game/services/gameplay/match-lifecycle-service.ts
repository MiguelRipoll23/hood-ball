import { inject, injectable } from "@needle-di/core";
import { API_SERVICE_TOKEN, type APIServiceContract } from "../../interfaces/services/network/api-contract-interface.js";
import { WEB_RTC_SERVICE_TOKEN, type WebRTCServiceContract } from "../../../engine/interfaces/services/network/webrtc-service-contract.js";
import { EVENT_PROCESSOR_SERVICE_TOKEN, type EventProcessorServiceContract } from "../../../engine/interfaces/services/events/event-processor-service-contract.js";
import { EVENT_CONSUMER_SERVICE_TOKEN, type EventConsumerServiceContract } from "../../../engine/interfaces/services/gameplay/event-consumer-service-interface.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { GameEventType } from "../../enums/event-type.js";
import type { SaveUserScoresRequest } from "../../interfaces/requests/save-score-request-interface.js";
import { GamePlayer } from "../../models/game-player.js";
import type { MatchmakingNetworkServiceContract } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import { MATCHMAKING_NETWORK_SERVICE_TOKEN } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import { DisconnectionMonitor } from "./disconnection-monitor.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload-interface.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

@injectable()
export class MatchLifecycleService {
  private gameOverFinalized = false;
  private gameOverInProgress = false;

  constructor(
    private readonly apiService: APIServiceContract = inject(
      API_SERVICE_TOKEN,
    ),
    private readonly webrtcService: WebRTCServiceContract = inject(
      WEB_RTC_SERVICE_TOKEN,
    ),
    private readonly networkService: MatchmakingNetworkServiceContract = inject(
      MATCHMAKING_NETWORK_SERVICE_TOKEN,
    ),
    private readonly eventProcessor: EventProcessorServiceContract = inject(
      EVENT_PROCESSOR_SERVICE_TOKEN,
    ),
    private readonly eventConsumer: EventConsumerServiceContract = inject(
      EVENT_CONSUMER_SERVICE_TOKEN,
    ),
    private readonly disconnectionMonitor = inject(DisconnectionMonitor),
    private readonly matchSessionService = inject(MatchSessionService),
  ) {
    this.eventConsumer.subscribeToLocalEvent(
      GameEventType.PlayerDisconnected,
      (data: PlayerDisconnectedPayload) => {
        if (!this.gameOverInProgress || !data?.player) {
          return;
        }
        const playerId = data.player.getId();
        this.disconnectionMonitor.markDisconnected(playerId, () =>
          this.finalizeGameOver(),
        );
      },
    );
  }

  public async savePlayerScore(): Promise<void> {
    const players = this.matchSessionService.getMatch()?.getPlayers();
    if (!players || players.length === 0) {
      EngineLogger.warn("MatchLifecycleService", "No players in the match to save score");
      return;
    }
    const savePlayerScoresRequest: SaveUserScoresRequest[] = [];
    players.forEach((player: GamePlayer) => {
      const playerId = player.getId();
      const totalScore = player.getScore();
      savePlayerScoresRequest.push({ userId: playerId, totalScore });
    });
    await this.apiService.saveScore(savePlayerScoresRequest);
  }

  public async handleGameOver(): Promise<void> {
    if (this.gameOverFinalized || this.gameOverInProgress) {
      return;
    }

    this.gameOverInProgress = true;
    this.gameOverFinalized = false;

    if (this.matchSessionService.getMatch()?.isHost()) {
      const peers = this.webrtcService.getPeers();
      const playerIds: string[] = [];
      peers.forEach((peer: WebRTCPeer) => {
        const playerId = peer.getPlayer()?.getId();
        if (playerId) {
          playerIds.push(playerId);
        }
        peer.disconnectGracefully();
      });

      this.networkService.removePingCheckInterval();
      this.networkService.removeMatchAdvertiseInterval();
      await this.apiService
        .removeMatch()
        .catch((error: unknown) => EngineLogger.error("MatchLifecycleService", "Failed to save score:", error));

      this.disconnectionMonitor.track(playerIds, () => {
        EngineLogger.warn("MatchLifecycleService", "Game over timeout reached, forcing finalization");
        this.finalizeGameOver();
      });

      if (playerIds.length === 0) {
        this.finalizeGameOver();
      }
    } else {
      this.finalizeGameOver();
    }
  }

  public async leaveMatch(): Promise<void> {
    if (this.gameOverFinalized || this.gameOverInProgress) {
      return;
    }

    const match = this.matchSessionService.getMatch();
    if (!match) {
      return;
    }

    const isHost = match.isHost();

    // Clear match immediately so network callbacks know we are leaving intentionally
    this.matchSessionService.setMatch(null);

    this.networkService.disconnect();

    if (isHost) {
      this.networkService.removePingCheckInterval();
      this.networkService.removeMatchAdvertiseInterval();
      // Remove match from the backend in the background so we don't block the UI
      this.apiService
        .removeMatch()
        .catch((error: unknown) => EngineLogger.error("MatchLifecycleService", "Failed to save score:", error));
    }

    EngineLogger.info("MatchLifecycleService", "Left match");
  }

  private finalizeGameOver(): void {
    if (this.gameOverFinalized) {
      EngineLogger.info("MatchLifecycleService", "Game over already finalized, skipping");
      return;
    }
    this.gameOverFinalized = true;
    this.gameOverInProgress = false;
    if (this.disconnectionMonitor.isTracking()) {
      this.disconnectionMonitor.clear();
    }
    this.matchSessionService.setMatch(null);
    const localEvent = new LocalEvent(GameEventType.ReturnToMainMenu);
    this.eventProcessor.addLocalEvent(localEvent);
    EngineLogger.info("MatchLifecycleService", "Game over finalized, returning to main menu");
  }
}
