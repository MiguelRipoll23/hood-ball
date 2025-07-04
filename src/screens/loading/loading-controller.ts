import type { GameState } from "../../core/services/game-state.js";
import { EventConsumerService } from "../../services/gameplay/event-consumer-service.js";
import { WorldScreen } from "../world/world-screen.js";
import { container } from "../../core/services/di-container.js";

export class LoadingController {
  constructor(private readonly gameState: GameState) {}

  public createWorldScreen(): WorldScreen {
    const worldScreen = new WorldScreen(
      this.gameState,
      container.get(EventConsumerService)
    );
    worldScreen.load();
    return worldScreen;
  }
}
