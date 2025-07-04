import type { ScreenManager } from "../../screens/screen-manager.js";
import type { GameScreen } from "../../screens/game-screen.js";

export interface IScreenTransitionService {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isTransitionActive(): boolean;
  fadeOutAndIn(screenManager: ScreenManager, nextScreen: GameScreen, outSeconds: number, inSeconds: number): void;
  crossfade(screenManager: ScreenManager, nextScreen: GameScreen, seconds: number): void;
}
