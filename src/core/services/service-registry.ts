import { GameState } from "../models/game-state.js";
import { container } from "./di-container.js";
import { EventProcessorService } from "./gameplay/event-processor-service.js";
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
import { CredentialService } from "../../game/services/security/credential-service.js";
import { CameraService } from "./gameplay/camera-service.js";
import { SpawnPointService } from "../../game/services/gameplay/spawn-point-service.js";
import { ChatService } from "../../game/services/network/chat-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    container.bind({ provide: GameState, useValue: gameState });
    container.bind({ provide: APIService, useClass: APIService });
    container.bind({
      provide: EventProcessorService,
      useClass: EventProcessorService,
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
      provide: EntityOrchestratorService,
      useClass: EntityOrchestratorService,
    });
    container.bind({ provide: WebRTCService, useClass: WebRTCService });
    container.bind({ provide: ChatService, useClass: ChatService });
    container.bind({ provide: CameraService, useClass: CameraService });
    container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
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
      const eventProcessorService: EventProcessorService = container.get(
        EventProcessorService
      );

      if (
        !webrtcService ||
        !matchmakingService ||
        !entityOrchestratorService ||
        !eventProcessorService
      ) {
        throw new Error("Failed to resolve core services");
      }

      entityOrchestratorService.initialize(webrtcService);
      eventProcessorService.initialize(webrtcService);
      webrtcService.initialize(matchmakingService.getNetworkService());
    } catch (error) {
      console.error("Error initializing services", error);
    }
  }
}
