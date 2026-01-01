import { inject, injectable } from "@needle-di/core";
import { APIService } from "../network/api-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { EventType } from "../../../engine/enums/event-type.js";
import type { SaveUserScoresRequest } from "../../interfaces/requests/save-score-request-interface.js";
import { GamePlayer } from "../../models/game-player.js";
import type { MatchmakingNetworkServiceContract } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import { DisconnectionMonitor } from "./disconnection-monitor.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
} from "./matchmaking-tokens.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload-interface.js";
import type { WebRTCPeer } from "../../../engine/interfaces/network/webrtc-peer-interface.js";
import { MatchSessionService } from "../session/match-session-service.js";

@injectable()
export class MatchLifecycleService {
  private gameOverFinalized = false;
  private gameOverInProgress = false;

  constructor(
    private readonly apiService = inject(APIService),
    private readonly webrtcService = inject(WebRTCService),
    private readonly networkService: MatchmakingNetworkServiceContract = inject(
      MatchmakingNetworkService
    ),
    private readonly eventProcessor = inject(EventProcessorService),
    private readonly eventConsumer = inject(EventConsumerService),
    private readonly disconnectionMonitor = inject(DisconnectionMonitor),
    private readonly pendingIdentities = inject(PendingIdentitiesToken),
    private readonly receivedIdentities = inject(ReceivedIdentitiesToken),
    private readonly matchSessionService = inject(MatchSessionService)
  ) {
    this.eventConsumer.subscribeToLocalEvent(
      EventType.PlayerDisconnected,
      (data: PlayerDisconnectedPayload) => {
        if (!this.gameOverInProgress || !data?.player) {
          return;
        }
        const playerId = data.player.getId();
        this.disconnectionMonitor.markDisconnected(playerId, () =>
          this.finalizeGameOver()
        );
      }
    );
  }

  public async savePlayerScore(): Promise<void> {
    const players = this.matchSessionService.getMatch()?.getPlayers();
    if (!players || players.length === 0) {
      console.warn("No players in the match to save score");
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
      await this.apiService
        .removeMatch()
        .catch((error: unknown) => console.error(error));

      this.disconnectionMonitor.track(playerIds, () => {
        console.warn("Game over timeout reached, forcing finalization");
        this.finalizeGameOver();
      });

      if (playerIds.length === 0) {
        this.finalizeGameOver();
      }
    } else {
      this.finalizeGameOver();
    }
  }

  private finalizeGameOver(): void {
    if (this.gameOverFinalized) {
      console.log("Game over already finalized, skipping");
      return;
    }
    this.gameOverFinalized = true;
    this.gameOverInProgress = false;
    if (this.disconnectionMonitor.isTracking()) {
      this.disconnectionMonitor.clear();
    }
    this.matchSessionService.setMatch(null);
    this.pendingIdentities.clear();
    this.receivedIdentities.clear();
    const localEvent = new LocalEvent(EventType.ReturnToMainMenu);
    this.eventProcessor.addLocalEvent(localEvent);
    console.log("Game over finalized, returning to main menu");
  }
}
