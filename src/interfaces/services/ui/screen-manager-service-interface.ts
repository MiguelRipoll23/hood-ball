import type { GameScreen } from "../../screens/game-screen.js";
import type { IScreenTransitionService } from "./screen-transition-service-interface.js";

export interface IScreenManagerService {
  getTransitionService(): IScreenTransitionService;
  setInitialScreen(screen: GameScreen): void;
  getPreviousScreen(): GameScreen | null;
  getCurrentScreen(): GameScreen | null;
  getNextScreen(): GameScreen | null;
  setCurrentScreen(currentScreen: GameScreen): void;
  setNextScreen(nextScreen: GameScreen | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
