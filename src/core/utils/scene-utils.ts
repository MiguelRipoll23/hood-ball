import { GameFrame } from "../models/game-frame.js";
import { BaseMultiplayerScene } from "../scenes/base-multiplayer-scene.js";
import type { MultiplayerScene } from "../../game/interfaces/scenes/multiplayer-scene.js";

export class SceneUtils {
  public static getSceneById(
    gameFrame: GameFrame,
    sceneId: number
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
