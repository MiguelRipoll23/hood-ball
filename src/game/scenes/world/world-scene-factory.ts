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
import { container } from "../../../engine/services/di-container.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { MatchmakingControllerService } from "../../services/gameplay/matchmaking-controller-service.js";
import { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import { ChatService } from "../../services/network/chat-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameServer } from "../../models/game-server.js";
import { MatchSessionService } from "../../services/session/match-session-service.js";
import { WorldScene } from "./world-scene.js";
import type { WorldSceneDependencies } from "./world-scene-dependencies.js";

@injectable()
export class WorldSceneFactory implements WorldSceneFactoryContract {
  public create(options: WorldSceneFactoryOptions = {}): WorldScene {
    const replayMode = options.replayMode ?? false;
    const deps: WorldSceneDependencies = {
      gameState: container.get(GameState),
      eventConsumerService: container.get(EventConsumerService),
      sceneTransitionService: container.get(SceneTransitionService),
      timerManagerService: container.get(TimerManagerService),
      matchmakingService: replayMode
        ? null
        : container.get(MatchmakingService),
      matchmakingController: replayMode
        ? null
        : container.get(MatchmakingControllerService),
      entityOrchestrator: replayMode
        ? null
        : container.get(EntityOrchestratorService),
      eventProcessorService: container.get(EventProcessorService),
      spawnPointService: replayMode ? null : container.get(SpawnPointService),
      chatService: replayMode ? null : container.get(ChatService),
      matchActionsLogService: replayMode
        ? null
        : container.get(MatchActionsLogService),
      gamePlayer: container.get(GamePlayer),
      gameServer: container.get(GameServer),
      matchSessionService: container.get(MatchSessionService),
      replayMode,
    };
    return new WorldScene(deps);
  }
}
