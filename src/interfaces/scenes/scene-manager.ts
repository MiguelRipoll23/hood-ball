import type { GameScene } from "./game-scene.js";

export interface SceneManager {
  getPreviousScreen(): GameScene | null;
  getCurrentScreen(): GameScene | null;
  getNextScreen(): GameScene | null;
  setCurrentScreen(screen: GameScene): void;
  setNextScreen(screen: GameScene | null): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
