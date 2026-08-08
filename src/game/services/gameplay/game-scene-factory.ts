import type { SceneFactory } from "../../../engine/interfaces/scenes/scene-factory-interface.js";
import type { GameScene } from "../../../engine/interfaces/scenes/game-scene-interface.js";
import { container } from "../../../engine/services/di-container.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { GameSceneType } from "../../enums/scene-type.js";
import { WorldScene } from "../../scenes/world/world-scene.js";

/**
 * GameSceneFactory — Creates game scenes by type ID for recording playback.
 *
 * Implements the engine's SceneFactory interface, allowing the engine
 * to create game scenes without importing game code directly.
 */
export class GameSceneFactory implements SceneFactory {
  public createScene(sceneId: number): GameScene | null {
    const gameState = container.get(GameState);

    if (sceneId === GameSceneType.World) {
      return new WorldScene(
        gameState,
        container.get(EventConsumerService),
        container.get(SceneTransitionService),
        container.get(TimerManagerService),
        null, // matchmakingService - not needed for replay
        null, // matchmakingController - not needed for replay
        null, // entityOrchestrator - not needed for replay
        container.get(EventProcessorService),
        null, // spawnPointService - not needed for replay
        null, // chatService - not needed for replay
        null, // matchActionsLogService - not needed for replay
        true // REPLAY MODE - don't create entities
      );
    }

    return null;
  }
}
