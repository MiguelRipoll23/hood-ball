import { BaseCollidingGameScene } from "../../../engine/scenes/base-colliding-game-scene.js";
import type { SceneType } from "../../../engine/enums/scene-type.js";
import { GameSceneType } from "../../enums/scene-type.js";
import { WorldEntityFactory } from "../world/world-entity-factory.js";
import type { GameState } from "../../../engine/models/game-state.js";
import type { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

/**
 * Minimal scene for replay playback. Avoids all the conditional replay-mode
 * logic that was previously scattered throughout WorldScene.
 *
 * The RecordingPlayerService drives entity spawning and state updates;
 * this scene only provides a background and the scene infrastructure.
 */
export class ReplayScene extends BaseCollidingGameScene {
  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
  ) {
    super(gameState, eventConsumerService);
    this.isReplayMode = true;
    EngineLogger.info("ReplayScene", "ReplayScene created");
  }

  public override getTypeId(): SceneType {
    return GameSceneType.World;
  }

  public override load(): void {
    const factory = new WorldEntityFactory(this.gameState, this.canvas);
    factory.createBackground(this.worldEntities);
    this.loaded = true;
  }

  public override update(_deltaTimeStamp: DOMHighResTimeStamp): void {
    // Entities are driven by RecordingPlayerService, not game logic.
  }
}
