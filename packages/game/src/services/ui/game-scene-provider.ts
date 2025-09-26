import { injectable } from "@needle-di/core";
import type { GameScene } from "@engine/interfaces/scenes/game-scene.js";
import type { GameState } from "../../state/game-state.js";
import type { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import type { GameSceneProviderContract } from "../../interfaces/services/ui/game-scene-provider-interface.js";
import { MainScene } from "../../scenes/main/main-scene.js";
import { LoginScene } from "../../scenes/main/login/login-scene.js";
import { MainMenuScene } from "../../scenes/main/main-menu/main-menu-scene.js";
import { SceneManagerService } from "@engine/services/scene/scene-manager-service.js";
import { SceneTransitionService } from "@engine/services/scene/scene-transition-service.js";
import type { RootGameScene } from "@game/interfaces/scenes/root-game-scene.js";
import type { MainMenuSceneContract } from "@game/interfaces/scenes/main-menu-scene-contract.js";

@injectable()
export class GameSceneProvider implements GameSceneProviderContract {
  public createRootScene(
    gameState: GameState,
    eventConsumer: EventConsumerService
  ): RootGameScene {
    const sceneManager = new SceneManagerService(new SceneTransitionService());
    return new MainScene(gameState, eventConsumer, sceneManager);
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
  ): MainMenuSceneContract {
    return new MainMenuScene(gameState, eventConsumer, showNews);
  }
}





