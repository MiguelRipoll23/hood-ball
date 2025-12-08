import type { SceneManager } from "../../../../engine/interfaces/scenes/scene-manager.js";
import type { GameScene } from "../../../../engine/interfaces/scenes/game-scene.js";

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
