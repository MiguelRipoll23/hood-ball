import type { GameScene } from "@engine/interfaces/scenes/game-scene.js";

export interface MainMenuSceneContract extends GameScene {
  startServerReconnection(): void;
  setPendingMessage(message: string): void;
}
