import type { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";
import { gameContext } from "../../context/game-context.js";
import { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { MatchmakingService } from "../../services/gameplay/matchmaking-service.js";
import { MatchmakingControllerService } from "../../services/gameplay/matchmaking-controller-service.js";
import { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import { ChatService } from "../../services/network/chat-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";

export class LoadingController {
  constructor(private readonly gameState: GameState) {}

  public createWorldScene(): WorldScene {
    const worldScene = new WorldScene(
      this.gameState,
      gameContext.get(EventConsumerService),
      gameContext.get(SceneTransitionService),
      gameContext.get(TimerManagerService),
      gameContext.get(MatchmakingService),
      gameContext.get(MatchmakingControllerService),
      gameContext.get(EntityOrchestratorService),
      gameContext.get(EventProcessorService),
      gameContext.get(SpawnPointService),
      gameContext.get(ChatService),
      gameContext.get(MatchActionsLogService)
    );
    worldScene.load();
    return worldScene;
  }
}
