import type { SceneManager } from "../../scenes/scene-manager-interface.js";
import type { GameScene } from "../../scenes/game-scene-interface.js";

export interface SceneTransitionServiceContract {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isTransitionActive(): boolean;
  fadeOutAndIn(
    sceneManager: SceneManager,
    nextScene: GameScene,
    outSeconds: number,
    inSeconds: number
  ): void;
  crossfade(
    sceneManager: SceneManager,
    nextScene: GameScene,
    seconds: number
  ): void;
}
