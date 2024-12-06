import { GameScreen } from "./game-screen.js";

export interface ScreenManager {
  getCurrentScreen(): GameScreen | null;
  getNextScreen(): GameScreen | null;
  setCurrentScreen(screen: GameScreen): void;
  setNextScreen(screen: GameScreen | null): void;
}
