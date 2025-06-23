import { GameState } from "../models/game-state.js";
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
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    ServiceManager.registerGameStates(gameState);
    ServiceManager.registerCoreServices(gameState);
    ServiceManager.registerCommunicationServices();
    ServiceManager.registerGameplayServices();
    ServiceManager.initializeServices();
  }

  private static registerGameStates(gameState: GameState): void {
    ServiceLocator.register(GameState, gameState);
  }

  private static registerCoreServices(gameState: GameState): void {
    const gameFrame = gameState.getGameFrame();

    ServiceLocator.register(DebugService, new DebugService());
    ServiceLocator.register(CryptoService, new CryptoService());
    ServiceLocator.register(
      ScreenTransitionService,
      new ScreenTransitionService(gameFrame)
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
      new ObjectOrchestratorService()
    );
  }

  private static registerGameplayServices(): void {
    ServiceLocator.register(APIService, new APIService());
    ServiceLocator.register(CredentialService, new CredentialService());
    ServiceLocator.register(MatchmakingService, new MatchmakingService());
  }

  private static registerCommunicationServices(): void {
    ServiceLocator.register(WebSocketService, new WebSocketService());
    ServiceLocator.register(WebRTCService, new WebRTCService());
  }

  private static initializeServices() {
    ServiceLocator.get(ObjectOrchestratorService).initialize();
    ServiceLocator.get(EventProcessorService).initialize();
    ServiceLocator.get(WebRTCService).initialize();
  }
}
