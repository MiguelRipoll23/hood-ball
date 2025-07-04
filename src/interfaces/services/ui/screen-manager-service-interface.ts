import type { GameScreen } from "../../screens/game-screen.js";
import type { ScreenTransitionService } from "../../../services/ui/screen-transition-service.js";

export interface IScreenManagerService {
  getTransitionService(): ScreenTransitionService;
  setInitialScreen(screen: GameScreen): void;
  getPreviousScreen(): GameScreen | null;
  getCurrentScreen(): GameScreen | null;
  getNextScreen(): GameScreen | null;
  setCurrentScreen(currentScreen: GameScreen): void;
  setNextScreen(nextScreen: GameScreen | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
