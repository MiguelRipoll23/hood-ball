import type { GameFrame } from "../../engine/models/game-frame.js";
import type { SceneManagerServiceContract } from "../../engine/interfaces/services/scene/scene-manager-service-contract.js";
import type { SceneTransitionServiceContract } from "../../engine/interfaces/services/scene/scene-transition-service-contract.js";
import { MainScene } from "../scenes/main/main-scene.js";
import { LoginScene } from "../scenes/main/login/login-scene.js";

export class SceneTransitionUtils {
  /**
   * Transitions to the login scene with an optional error message
   * Can be used from either a scene with SceneManagerService or WorldScene with direct transition service
   */
  public static transitionToLoginScene(
    options: {
      sceneManager?: SceneManagerServiceContract;
      transitionService?: SceneTransitionServiceContract;
      gameFrame?: GameFrame;
      errorMessage?: string;
    }
  ): void {
    const mainScene = new MainScene();
    const loginScene = new LoginScene();

    if (options.errorMessage) {
      loginScene.setPendingError(options.errorMessage);
    }

    mainScene.activateScene(loginScene);
    mainScene.load();

    // Use sceneManager if provided (MainMenuScene pattern)
    if (options.sceneManager) {
      options.sceneManager
        .getTransitionService()
        .fadeOutAndIn(options.sceneManager, mainScene, 0.5, 0.5);
    } 
    // Use transitionService + gameFrame if provided (WorldScene pattern)
    else if (options.transitionService && options.gameFrame) {
      options.transitionService.fadeOutAndIn(
        options.gameFrame,
        mainScene,
        1,
        1
      );
    } else {
      console.error("Invalid arguments for transitionToLoginScene");
    }
  }
}
