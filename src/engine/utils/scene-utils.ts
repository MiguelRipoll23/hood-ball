import { GameFrame } from "../models/game-frame.ts";
import { BaseMultiplayerScene } from "../scenes/base-multiplayer-scene.ts";
import type { MultiplayerScene } from "../interfaces/scenes/multiplayer-scene-interface.ts";
import type { SceneType } from "../enums/scene-type.ts";

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
