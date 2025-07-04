import { GameState } from "./game-state.js";
import { container } from "./di-container.js";
import { EventProcessorService } from "./event-processor-service.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { ObjectOrchestratorService } from "../../services/gameplay/object-orchestrator-service.js";
import { WebRTCService } from "../../services/network/webrtc-service.js";
import { APIService } from "../../services/network/api-service.js";
import { CryptoService } from "../../services/security/crypto-service.js";
import { LoadingIndicatorService } from "../../services/ui/loading-indicator-service.js";
import { MatchFinderService } from "../../services/gameplay/match-finder-service.js";
import { MatchmakingNetworkService } from "../../services/network/matchmaking-network-service.js";
import { PendingIdentitiesToken, ReceivedIdentitiesToken } from "../../services/gameplay/matchmaking-tokens.js";
import { CredentialService } from "../../services/security/credential-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    container.bind({ provide: GameState, useValue: gameState });
    container.bind({ provide: APIService, useClass: APIService });
    container.bind({ provide: EventProcessorService, useClass: EventProcessorService });
    container.bind({ provide: CryptoService, useClass: CryptoService });
    container.bind({ provide: CredentialService, useClass: CredentialService });
    container.bind({ provide: LoadingIndicatorService, useClass: LoadingIndicatorService });
    container.bind({ provide: MatchFinderService, useClass: MatchFinderService });
    container.bind({ provide: MatchmakingNetworkService, useClass: MatchmakingNetworkService });
    container.bind({ provide: MatchmakingService, useClass: MatchmakingService });
    container.bind({ provide: PendingIdentitiesToken, useValue: new Map<string, boolean>() });
    container.bind({
      provide: ReceivedIdentitiesToken,
      useValue: new Map<string, { playerId: string; playerName: string }>(),
    });
    ServiceRegistry.initializeServices();
  }


  private static initializeServices() {
    try {
      const webrtcService: WebRTCService = container.get(WebRTCService);
      const matchmakingService: MatchmakingService = container.get(MatchmakingService);
      const orchestratorService: ObjectOrchestratorService = container.get(ObjectOrchestratorService);
      const eventProcessorService: EventProcessorService = container.get(EventProcessorService);

      if (!webrtcService || !matchmakingService || !orchestratorService || !eventProcessorService) {
        throw new Error("Failed to resolve core services");
      }

      orchestratorService.initialize();
      eventProcessorService.initialize(webrtcService);
      webrtcService.initialize(matchmakingService.getNetworkService());
    } catch (error) {
      console.error("Error initializing services", error);
    }
  }
}
