import type { GameScreen } from "./game-screen.js";

export interface ScreenManager {
  getPreviousScreen(): GameScreen | null;
  getCurrentScreen(): GameScreen | null;
  getNextScreen(): GameScreen | null;
  setCurrentScreen(screen: GameScreen): void;
  setNextScreen(screen: GameScreen | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
