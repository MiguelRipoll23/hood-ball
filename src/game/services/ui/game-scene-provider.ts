import { injectable } from "@needle-di/core";
import type { GameScene } from "../../../core/interfaces/scenes/game-scene.js";
import type { GameState } from "../../state/game-state.js";
import type { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import type { GameSceneProviderContract } from "../../interfaces/services/ui/game-scene-provider-interface.js";
import { MainScene } from "../../scenes/main/main-scene.js";
import { LoginScene } from "../../scenes/main/login/login-scene.js";
import { MainMenuScene } from "../../scenes/main/main-menu/main-menu-scene.js";

@injectable()
export class GameSceneProvider implements GameSceneProviderContract {
  public createRootScene(
    gameState: GameState,
    eventConsumer: EventConsumerService
  ): GameScene {
    return new MainScene(gameState, eventConsumer);
  }

  public createLoginScene(
    gameState: GameState,
    eventConsumer: EventConsumerService
  ): GameScene {
    return new LoginScene(gameState, eventConsumer);
  }

  public createMainMenuScene(
    gameState: GameState,
    eventConsumer: EventConsumerService,
    showNews: boolean
  ): GameScene {
    return new MainMenuScene(gameState, eventConsumer, showNews);
  }
}






