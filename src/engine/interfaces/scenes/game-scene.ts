import { LayerType } from "../../enums/layer-type.js";
import type { GameEntity } from "../../models/game-entity.js";
import type { SceneManager } from "./scene-manager.js";

export interface GameScene {
  isActive(): boolean;

  getUIEntities(): GameEntity[];
  getWorldEntities(): GameEntity[];

  getSceneManagerService(): SceneManager | null;
  setSceneManagerService(sceneManagerService: SceneManager): void;

  load(): void;
  hasLoaded(): boolean;

  getEntityLayer(entity: GameEntity): LayerType;
  addEntityToSceneLayer(entity: GameEntity): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  onTransitionStart(): void;
  onTransitionEnd(): void;

  /**
   * Cleanup resources when the scene is removed from the stack.
   */
  dispose(): void;

  /**
   * Re-subscribe events when returning to a previously disposed scene.
   */
  resubscribeEvents(): void;
}
