import type { GameState } from "../../../core/models/game-state.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";
import { container } from "../../../core/services/di-container.js";

export class LoadingController {
  constructor(private readonly gameState: GameState) {}

  public createWorldScene(): WorldScene {
    const worldScene = new WorldScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    worldScene.load();
    return worldScene;
  }
}
