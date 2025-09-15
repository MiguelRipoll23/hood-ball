import { GameState } from "../models/game-state.js";
import { container } from "./di-container.js";
import { EventProcessorService } from "./gameplay/event-processor-service.js";
import { EventConsumerService } from "./gameplay/event-consumer-service.js";
import { MatchmakingService } from "../../game/services/gameplay/matchmaking-service.js";
import { EntityOrchestratorService } from "../../game/services/gameplay/entity-orchestrator-service.js";
import { WebRTCService } from "../../game/services/network/webrtc-service.js";
import { APIService } from "../../game/services/network/api-service.js";
import { CryptoService } from "./security/crypto-service.js";
import { LoadingIndicatorService } from "../../game/services/ui/loading-indicator-service.js";
import { MatchFinderService } from "../../game/services/gameplay/match-finder-service.js";
import { MatchmakingNetworkService } from "../../game/services/network/matchmaking-network-service.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
} from "../../game/services/gameplay/matchmaking-tokens.js";
import { MatchLifecycleService } from "../../game/services/gameplay/match-lifecycle-service.js";
import { DisconnectionMonitor } from "../../game/services/gameplay/disconnection-monitor.js";
import { MatchmakingCoordinator } from "../../game/services/gameplay/matchmaking-coordinator.js";
import { CredentialService } from "../../game/services/security/credential-service.js";
import { CameraService } from "./gameplay/camera-service.js";
import { SpawnPointService } from "../../game/services/gameplay/spawn-point-service.js";
import { ChatService } from "../../game/services/network/chat-service.js";
import { AnimationLogService } from "./gameplay/animation-log-service.js";
import { MatchActionsLogService } from "../../game/services/gameplay/match-actions-log-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    container.bind({ provide: GameState, useValue: gameState });
    container.bind({ provide: APIService, useClass: APIService });
    container.bind({
      provide: EventProcessorService,
      useClass: EventProcessorService,
    });
    container.bind({
      provide: EventConsumerService,
      useClass: EventConsumerService,
    });
    container.bind({ provide: CryptoService, useClass: CryptoService });
    container.bind({ provide: CredentialService, useClass: CredentialService });
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
    container.bind({ provide: AnimationLogService, useClass: AnimationLogService });
    container.bind({ provide: CameraService, useClass: CameraService });
    container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
    container.bind({
      provide: MatchActionsLogService,
      useClass: MatchActionsLogService,
    });
    container.bind({
      provide: PendingIdentitiesToken,
      useValue: new Map<string, boolean>(),
    });
    container.bind({
      provide: ReceivedIdentitiesToken,
      useValue: new Map<string, { playerId: string; playerName: string }>(),
    });
    ServiceRegistry.initializeServices();
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
