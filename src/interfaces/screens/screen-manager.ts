import type { GameScreen } from "./game-screen.js";

export interface ScreenManager {
  getCurrentScreen(): GameScreen | null;
  getNextScreen(): GameScreen | null;
  getPreviousScreen(): GameScreen | null;
  setCurrentScreen(screen: GameScreen): void;
  setNextScreen(screen: GameScreen | null): void;
  setInitialScreen(screen: GameScreen): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
