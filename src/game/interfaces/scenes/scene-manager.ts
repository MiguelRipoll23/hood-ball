import type { GameScene } from "./game-scene.js";

export interface SceneManager {
  getPreviousScene(): GameScene | null;
  getCurrentScene(): GameScene | null;
  getNextScene(): GameScene | null;
  setCurrentScene(scene: GameScene): void;
  setNextScene(scene: GameScene | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
