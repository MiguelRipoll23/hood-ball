import { GameFrame } from "./game-frame.js";
import { BaseMultiplayerScene } from "./base-multiplayer-scene.js";
import type { MultiplayerScene } from "../../interfaces/scenes/multiplayer-scene.js";

export class SceneUtils {
  public static getScreenById(
    gameFrame: GameFrame,
    screenId: number
  ): MultiplayerScene | null {
    const currentScreen = gameFrame.getCurrentScreen();

    if (currentScreen instanceof BaseMultiplayerScene) {
      return currentScreen.getTypeId() === screenId ? currentScreen : null;
    }

    const nextScreen = gameFrame.getNextScreen();

    if (nextScreen instanceof BaseMultiplayerScene) {
      return nextScreen.getTypeId() === screenId ? nextScreen : null;
    }

    return null;
  }
}
