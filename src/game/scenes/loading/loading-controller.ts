import type { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";
import { container } from "../../../engine/services/di-container.js";

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
