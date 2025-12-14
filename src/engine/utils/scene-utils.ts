import { GameFrame } from "../models/game-frame.js";
import { BaseMultiplayerScene } from "../scenes/base-multiplayer-scene.js";
import type { MultiplayerScene } from "../interfaces/scenes/multiplayer-scene-interface.js";
import type { SceneType } from "../../game/enums/scene-type.js";

export class SceneUtils {
  public static getSceneById(
    gameFrame: GameFrame,
    sceneId: SceneType
  ): MultiplayerScene | null {
    const currentScene = gameFrame.getCurrentScene();

    if (currentScene instanceof BaseMultiplayerScene) {
      return currentScene.getTypeId() === sceneId ? currentScene : null;
    }

    const nextScene = gameFrame.getNextScene();

    if (nextScene instanceof BaseMultiplayerScene) {
      return nextScene.getTypeId() === sceneId ? nextScene : null;
    }

    return null;
  }
}
