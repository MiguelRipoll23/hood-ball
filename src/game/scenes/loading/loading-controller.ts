import type { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";
import { container } from "../../../engine/services/di-container.js";
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
      container.get(EventConsumerService),
      container.get(SceneTransitionService),
      container.get(TimerManagerService),
      container.get(MatchmakingService),
      container.get(MatchmakingControllerService),
      container.get(EntityOrchestratorService),
      container.get(EventProcessorService),
      container.get(SpawnPointService),
      container.get(ChatService),
      container.get(MatchActionsLogService),
    );
    worldScene.load();
    return worldScene;
  }
}
