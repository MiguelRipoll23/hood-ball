import type { GameState } from "../models/game-state.js";
import { APIService } from "./api-service.js";
import { CredentialService } from "./credential-service.js";
import { CryptoService } from "./crypto-service.js";
import { DebugService } from "./debug-service.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { EventProcessorService } from "./event-processor-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { MatchmakingService } from "./matchmaking-service.js";
import { ObjectOrchestratorService } from "./object-orchestrator-service.js";
import { ScreenTransitionService } from "./screen-transition-service.js";
import { ServiceLocator } from "./service-locator.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { WebRTCService } from "./webrtc-service.js";
import { WebSocketService } from "./websocket-service.js";

export class ServiceManager {
  public static register(gameState: GameState): void {
    this.registerCoreServices(gameState);
    this.registerCommunicationServices(gameState);
    this.registerGameplayServices(gameState);
    this.initializeServices();
  }

  private static registerCoreServices(gameState: GameState): void {
    ServiceLocator.register(DebugService, new DebugService(gameState));
    ServiceLocator.register(CryptoService, new CryptoService(gameState));
    ServiceLocator.register(
      ScreenTransitionService,
      new ScreenTransitionService(gameState.getGameFrame())
    );
    ServiceLocator.register(TimerManagerService, new TimerManagerService());
    ServiceLocator.register(
      IntervalManagerService,
      new IntervalManagerService()
    );

    ServiceLocator.register(EventProcessorService, new EventProcessorService());
    ServiceLocator.register(EventConsumerService, new EventConsumerService());
    ServiceLocator.register(
      ObjectOrchestratorService,
      new ObjectOrchestratorService(gameState)
    );
  }

  private static registerGameplayServices(gameState: GameState): void {
    ServiceLocator.register(APIService, new APIService());
    ServiceLocator.register(
      CredentialService,
      new CredentialService(gameState)
    );
    ServiceLocator.register(
      MatchmakingService,
      new MatchmakingService(gameState)
    );
  }

  private static registerCommunicationServices(gameState: GameState): void {
    ServiceLocator.register(WebSocketService, new WebSocketService(gameState));
    ServiceLocator.register(WebRTCService, new WebRTCService(gameState));
  }

  private static initializeServices() {
    ServiceLocator.get(ObjectOrchestratorService).initialize();
    ServiceLocator.get(EventProcessorService).initialize();
    ServiceLocator.get(WebRTCService).initialize();
  }
}
