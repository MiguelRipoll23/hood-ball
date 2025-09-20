import type { GameState } from "../../state/game-state.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";
import { WorldScene } from "../world/world-scene.js";

export class LoadingController {
  constructor(
    private readonly gameState: GameState,
    private readonly eventConsumerService: EventConsumerService
  ) {}

  public createWorldScene(): WorldScene {
    const worldScene = new WorldScene(
      this.gameState,
      this.eventConsumerService
    );
    worldScene.load();
    return worldScene;
  }
}
