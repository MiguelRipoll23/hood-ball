import type { SceneManagerServiceContract } from "../scene/scene-manager-service-contract.js";
import type { GameScene } from "../../scenes/game-scene-interface.js";

export interface SceneTransitionServiceContract {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isTransitionActive(): boolean;
  fadeOutAndIn(
    sceneManager: SceneManagerServiceContract,
    nextScene: GameScene,
    outSeconds: number,
    inSeconds: number
  ): void;
  crossfade(
    sceneManager: SceneManagerServiceContract,
    nextScene: GameScene,
    seconds: number
  ): void;
}
