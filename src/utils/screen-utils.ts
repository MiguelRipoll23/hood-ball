import { GameFrame } from "../models/game-frame.js";
import { BaseMultiplayerScreen } from "../screens/base/base-multiplayer-screen.js";
import type { MultiplayerScreen } from "../interfaces/screen/multiplayer-screen.js";

export class ScreenUtils {
  public static getScreenById(
    gameFrame: GameFrame,
    screenId: number
  ): MultiplayerScreen | null {
    const currentScreen = gameFrame.getCurrentScreen();

    if (currentScreen instanceof BaseMultiplayerScreen) {
      return currentScreen.getTypeId() === screenId ? currentScreen : null;
    }

    const nextScreen = gameFrame.getNextScreen();

    if (nextScreen instanceof BaseMultiplayerScreen) {
      return nextScreen.getTypeId() === screenId ? nextScreen : null;
    }

    return null;
  }
}
