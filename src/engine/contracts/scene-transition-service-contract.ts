import type { SceneManager } from "../interfaces/scenes/scene-manager-interface.ts";
import type { GameScene } from "../interfaces/scenes/game-scene-interface.ts";

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
