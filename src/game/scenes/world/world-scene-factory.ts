import { injectable } from "@needle-di/core";
import type {
  WorldSceneFactoryContract,
  WorldSceneFactoryOptions,
} from "../../../engine/interfaces/services/gameplay/world-scene-factory-contract.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { gameContext } from "../../context/game-context.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { MatchmakingControllerService } from "../../services/gameplay/matchmaking-controller-service.js";
import { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import { ChatService } from "../../services/network/chat-service.js";
import { WorldScene } from "./world-scene.js";
import type { WorldSceneDependencies } from "./world-scene-dependencies.js";

@injectable()
export class WorldSceneFactory implements WorldSceneFactoryContract {
  public create(options: WorldSceneFactoryOptions = {}): WorldScene {
    const replayMode = options.replayMode ?? false;
    const deps: WorldSceneDependencies = {
      gameState: gameContext.get(GameState),
      eventConsumerService: gameContext.get(EventConsumerService),
      sceneTransitionService: gameContext.get(SceneTransitionService),
      timerManagerService: gameContext.get(TimerManagerService),
      matchmakingService: replayMode
        ? null
        : gameContext.get(MatchmakingService),
      matchmakingController: replayMode
        ? null
        : gameContext.get(MatchmakingControllerService),
      entityOrchestrator: replayMode
        ? null
        : gameContext.get(EntityOrchestratorService),
      eventProcessorService: gameContext.get(EventProcessorService),
      spawnPointService: replayMode ? null : gameContext.get(SpawnPointService),
      chatService: replayMode ? null : gameContext.get(ChatService),
      matchActionsLogService: replayMode
        ? null
        : gameContext.get(MatchActionsLogService),
      replayMode,
    };
    return new WorldScene(deps);
  }
}
