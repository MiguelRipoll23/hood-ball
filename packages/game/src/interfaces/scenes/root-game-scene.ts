import type { GameScene } from "@engine/interfaces/scenes/game-scene.js";
import type { SceneManager } from "@engine/interfaces/scenes/scene-manager.js";

export interface RootGameScene extends GameScene {
  activateScene(scene: GameScene): void;
  getSceneManagerService(): SceneManager | null;
}
