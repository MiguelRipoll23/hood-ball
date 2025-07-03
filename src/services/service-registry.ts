import { GameState } from "../models/game-state.js";
import { APIService } from "./api-service.js";
import { CredentialService } from "./credential-service.js";
import { CryptoService } from "./crypto-service.js";
import { DebugService } from "../debug/debug-service.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { EventProcessorService } from "./event-processor-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { MatchmakingService } from "./matchmaking-service.js";
import { MatchmakingControllerService } from "./matchmaking-controller-service.js";
import { ObjectOrchestratorService } from "./object-orchestrator-service.js";
import { ScreenTransitionService } from "./screen-transition-service.js";
import { ServiceLocator } from "./service-locator.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { WebRTCService } from "./webrtc-service.js";
import { WebSocketService } from "./websocket-service.js";
import { LoadingIndicatorService } from "./loading-indicator-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    ServiceRegistry.registerGameStates(gameState);
    ServiceRegistry.registerCoreServices();
    ServiceRegistry.registerCommunicationServices();
    ServiceRegistry.registerGameplayServices();
    ServiceRegistry.initializeServices();
  }

  private static registerGameStates(gameState: GameState): void {
    ServiceLocator.register(GameState, gameState);
  }

  private static registerCoreServices(): void {
    ServiceLocator.register(DebugService, new DebugService());
    ServiceLocator.register(CryptoService, new CryptoService());
    ServiceLocator.register(
      ScreenTransitionService,
      new ScreenTransitionService()
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
    ServiceLocator.register(LoadingIndicatorService, new LoadingIndicatorService());
  }

  private static registerGameplayServices(): void {
    ServiceLocator.register(APIService, new APIService());
    ServiceLocator.register(CredentialService, new CredentialService());
    ServiceLocator.register(MatchmakingService, new MatchmakingService());
    ServiceLocator.register(
      MatchmakingControllerService,
      new MatchmakingControllerService(),
    );
  }

  private static registerCommunicationServices(): void {
    ServiceLocator.register(WebSocketService, new WebSocketService());
    ServiceLocator.register(WebRTCService, new WebRTCService());
  }

  private static initializeServices() {
    const webrtcService = ServiceLocator.get(WebRTCService);
    const matchmakingService = ServiceLocator.get(MatchmakingService);
    ServiceLocator.get(ObjectOrchestratorService).initialize();
    ServiceLocator.get(EventProcessorService).initialize(webrtcService);
    webrtcService.initialize(matchmakingService.getNetworkService());
  }
}
