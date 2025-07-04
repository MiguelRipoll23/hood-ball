import { GameState } from "../models/game-state.js";
import { container } from "./di-container.js";
import { EventProcessorService } from "./gameplay/event-processor-service.js";
import { MatchmakingService } from "./gameplay/matchmaking-service.js";
import { ObjectOrchestratorService } from "./gameplay/object-orchestrator-service.js";
import { WebRTCService } from "./network/webrtc-service.js";

export class ServiceRegistry {
  public static register(canvas: HTMLCanvasElement, debugging: boolean): void {
    const gameState = new GameState(canvas, debugging);
    container.bind({ provide: GameState, useValue: gameState });
    ServiceRegistry.initializeServices();
  }


  private static initializeServices() {
    const webrtcService = container.get(WebRTCService);
    const matchmakingService = container.get(MatchmakingService);
    container.get(ObjectOrchestratorService).initialize();
    container.get(EventProcessorService).initialize(webrtcService);
    webrtcService.initialize(matchmakingService.getNetworkService());
  }
}
