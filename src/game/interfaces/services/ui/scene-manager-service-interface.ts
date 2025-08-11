import type { GameScene } from "../../../../core/interfaces/scenes/game-scene.js";
import type { SceneTransitionServiceContract } from "./scene-transition-service-interface.js";

export interface SceneManagerServiceContract {
  getTransitionService(): SceneTransitionServiceContract;
  setInitialScene(scene: GameScene): void;
  getPreviousScene(): GameScene | null;
  getCurrentScene(): GameScene | null;
  getNextScene(): GameScene | null;
  setCurrentScene(currentScene: GameScene): void;
  setNextScene(nextScene: GameScene | null): void;
  getScenes(): GameScene[];
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
