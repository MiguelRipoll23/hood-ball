import { inject, injectable } from "@needle-di/core";
import { GameState } from "../../state/game-state.js";
import { APIService } from "../network/api-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { EventType } from "../../enums/event-type.js";
import type { SaveUserScoresRequest } from "../../interfaces/requests/save-score-request.js";
import { GamePlayer } from "../../models/game-player.js";
import type { IMatchmakingNetworkService } from "../../interfaces/services/network/matchmaking-network-service-interface.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import { DisconnectionMonitor } from "./disconnection-monitor.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
  type PendingIdentityMap,
  type ReceivedIdentityMap,
} from "./matchmaking-tokens.js";
import type { PlayerDisconnectedPayload } from "../../interfaces/events/player-disconnected-payload.js";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";

@injectable()
export class MatchLifecycleService {
  private gameOverFinalized = false;
  private gameOverInProgress = false;

  constructor(
    private readonly gameState = inject(GameState),
    private readonly apiService = inject(APIService),
    private readonly webrtcService = inject(WebRTCService),
    private readonly networkService: IMatchmakingNetworkService = inject(
      MatchmakingNetworkService
    ),
    private readonly eventProcessor = inject(EventProcessorService),
    private readonly eventConsumer = inject(EventConsumerService),
    private readonly disconnectionMonitor = inject(DisconnectionMonitor),
    private readonly pendingIdentities: PendingIdentityMap = inject(
      PendingIdentitiesToken
    ) as PendingIdentityMap,
    private readonly receivedIdentities: ReceivedIdentityMap = inject(
      ReceivedIdentitiesToken
    ) as ReceivedIdentityMap
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
    const players = this.gameState.getMatch()?.getPlayers();
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

    if (this.gameState.getMatch()?.isHost()) {
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
      this.networkService.removeAdvertiseMatchInterval();
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
    this.gameState.setMatch(null);
    this.pendingIdentities.clear();
    this.receivedIdentities.clear();
    const localEvent = new LocalEvent(EventType.ReturnToMainMenu);
    this.eventProcessor.addLocalEvent(localEvent);
    console.log("Game over finalized, returning to main menu");
  }
}
