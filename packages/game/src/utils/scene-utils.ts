import { GameFrame } from "@engine/models/game-frame.js";
import { BaseMultiplayerScene } from "@game/scenes/base/base-multiplayer-scene.js";
import type { MultiplayerScene } from "@game/interfaces/scenes/multiplayer-scene.js";
import type { SceneType } from "@game/enums/scene-type.js";

export class SceneUtils {
  public static getSceneById(
    gameFrame: GameFrame,
    sceneId: SceneType
  ): MultiplayerScene | null {
    const currentScene = gameFrame.getCurrentScene();

    if (currentScene instanceof BaseMultiplayerScene) {
      return currentScene.getTypeId() === sceneId
        ? (currentScene as MultiplayerScene)
        : null;
    }

    const nextScene = gameFrame.getNextScene();

    if (nextScene instanceof BaseMultiplayerScene) {
      return nextScene.getTypeId() === sceneId
        ? (nextScene as MultiplayerScene)
        : null;
    }

    return null;
  }
}
