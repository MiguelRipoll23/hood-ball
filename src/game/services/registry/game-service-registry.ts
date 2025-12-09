import { container } from "../../../engine/services/di-container.js";
import { MatchmakingService } from "../gameplay/matchmaking-service.js";
import { EntityOrchestratorService } from "../gameplay/entity-orchestrator-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { APIService } from "../network/api-service.js";
import { LoadingIndicatorService } from "../ui/loading-indicator-service.js";
import { MatchFinderService } from "../gameplay/match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
} from "../gameplay/matchmaking-tokens.js";
import { MatchLifecycleService } from "../gameplay/match-lifecycle-service.js";
import { DisconnectionMonitor } from "../gameplay/disconnection-monitor.js";
import { MatchmakingCoordinator } from "../gameplay/matchmaking-coordinator.js";
import { CredentialService } from "../security/credential-service.js";
import { SpawnPointService } from "../gameplay/spawn-point-service.js";
import { ChatService } from "../network/chat-service.js";
import { MatchActionsLogService } from "../gameplay/match-actions-log-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameServer } from "../../models/game-server.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { GameLifecycleService } from "../lifecycle/game-lifecycle-service.js";
import { CryptoService } from "../security/crypto-service.js";
import { GameConfig } from "../../../engine/models/game-config.js";
import { GAME_VERSION } from "../../constants/game-constants.js";

export class GameServiceRegistry {
  public static register(): void {
    container.bind({ provide: GameConfig, useValue: { version: GAME_VERSION } });
    container.bind(GamePlayer);
    container.bind(GameServer);
    container.bind(MatchSessionService);
    container.bind(GameLifecycleService);
    container.bind(CryptoService);

    container.bind({ provide: APIService, useClass: APIService });
    container.bind({
      provide: LoadingIndicatorService,
      useClass: LoadingIndicatorService,
    });
    container.bind({
      provide: MatchFinderService,
      useClass: MatchFinderService,
    });
    container.bind({
      provide: MatchmakingNetworkService,
      useClass: MatchmakingNetworkService,
    });
    container.bind({
      provide: MatchmakingService,
      useClass: MatchmakingService,
    });
    container.bind({
      provide: MatchLifecycleService,
      useClass: MatchLifecycleService,
    });
    container.bind({
      provide: DisconnectionMonitor,
      useClass: DisconnectionMonitor,
    });
    container.bind({
      provide: MatchmakingCoordinator,
      useClass: MatchmakingCoordinator,
    });
    container.bind({
      provide: EntityOrchestratorService,
      useClass: EntityOrchestratorService,
    });
    container.bind({ provide: WebRTCService, useClass: WebRTCService });
    container.bind({ provide: ChatService, useClass: ChatService });
    container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
    container.bind({
      provide: MatchActionsLogService,
      useClass: MatchActionsLogService,
    });
    container.bind({ provide: CredentialService, useClass: CredentialService });
    container.bind({
      provide: PendingIdentitiesToken,
      useValue: new Map<string, boolean>(),
    });
    container.bind({
      provide: ReceivedIdentitiesToken,
      useValue: new Map<string, { playerId: string; playerName: string }>(),
    });

    GameServiceRegistry.initializeServices();
  }

  private static initializeServices() {
    try {
      const webrtcService: WebRTCService = container.get(WebRTCService);
      const matchmakingService: MatchmakingService =
        container.get(MatchmakingService);
      const entityOrchestratorService: EntityOrchestratorService =
        container.get(EntityOrchestratorService);
      const matchmakingCoordinator: MatchmakingCoordinator = container.get(
        MatchmakingCoordinator
      );

      if (
        !webrtcService ||
        !matchmakingService ||
        !entityOrchestratorService ||
        !matchmakingCoordinator
      ) {
        throw new Error("Failed to resolve core services");
      }

      entityOrchestratorService.initialize(webrtcService);
      matchmakingCoordinator.initialize();
    } catch (error) {
      console.error("Error initializing services", error);
    }
  }
}
