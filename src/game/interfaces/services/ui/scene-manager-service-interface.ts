import type { GameScene } from "../../scenes/game-scene.js";
import type { ISceneTransitionService } from "./scene-transition-service-interface.js";

export interface ISceneManagerService {
  getTransitionService(): ISceneTransitionService;
  setInitialScene(scene: GameScene): void;
  getPreviousScene(): GameScene | null;
  getCurrentScene(): GameScene | null;
  getNextScene(): GameScene | null;
  setCurrentScene(currentScene: GameScene): void;
  setNextScene(nextScene: GameScene | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
