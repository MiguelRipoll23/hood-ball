import type { GameScene } from "../../scenes/game-scene.js";
import type { ISceneTransitionService } from "./scene-transition-service-interface.js";

export interface ISceneManagerService {
  getTransitionService(): ISceneTransitionService;
  setInitialScreen(screen: GameScene): void;
  getPreviousScreen(): GameScene | null;
  getCurrentScreen(): GameScene | null;
  getNextScreen(): GameScene | null;
  setCurrentScreen(currentScreen: GameScene): void;
  setNextScreen(nextScreen: GameScene | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
