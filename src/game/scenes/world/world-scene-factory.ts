import { injectable } from "@needle-di/core";
import type {
  WorldSceneFactoryContract,
  WorldSceneFactoryOptions,
} from "../../../engine/interfaces/services/gameplay/world-scene-factory-contract.js";
import type { GameScene } from "../../../engine/interfaces/scenes/game-scene-interface.js";
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
import { ReplayScene } from "../replay/replay-scene.js";
import type { WorldSceneDependencies } from "./world-scene-dependencies.js";

@injectable()
export class WorldSceneFactory implements WorldSceneFactoryContract {
  public create(options: WorldSceneFactoryOptions = {}): GameScene {
    const replayMode = options.replayMode ?? false;

    if (replayMode) {
      return new ReplayScene(
        container.get(GameState),
        container.get(EventConsumerService),
      );
    }

    const deps: WorldSceneDependencies = {
      gameState: container.get(GameState),
      eventConsumerService: container.get(EventConsumerService),
      sceneTransitionService: container.get(SceneTransitionService),
      timerManagerService: container.get(TimerManagerService),
      matchmakingService: container.get(MatchmakingService),
      matchmakingController: container.get(MatchmakingControllerService),
      entityOrchestrator: container.get(EntityOrchestratorService),
      eventProcessorService: container.get(EventProcessorService),
      spawnPointService: container.get(SpawnPointService),
      chatService: container.get(ChatService),
      matchActionsLogService: container.get(MatchActionsLogService),
      gamePlayer: container.get(GamePlayer),
      gameServer: container.get(GameServer),
      matchSessionService: container.get(MatchSessionService),
    };
    return new WorldScene(deps);
  }
}
