import type { GameScene } from "../interfaces/scenes/game-scene-interface.ts";
import type { SceneTransitionServiceContract } from "./scene-transition-service-contract.ts";

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
