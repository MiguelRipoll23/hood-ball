import type { GameState } from "../../core/services/game-state.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";
import { container } from "../../core/services/di-container.js";

export class LoadingController {
  constructor(private readonly gameState: GameState) {}

  public createWorldScreen(): WorldScene {
    const worldScreen = new WorldScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    worldScreen.load();
    return worldScreen;
  }
}
