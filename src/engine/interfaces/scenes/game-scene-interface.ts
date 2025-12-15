import { LayerType } from "../../enums/layer-type.js";
import type { SceneType } from "../../../game/enums/scene-type.js";
import type { GameEntity } from "../../models/game-entity.js";
import type { SceneManagerServiceContract } from "../services/scene/scene-manager-service-contract.js";

export interface GameScene {
  isActive(): boolean;

  getTypeId(): SceneType;
  getUIEntities(): GameEntity[];
  getWorldEntities(): GameEntity[];

  getSceneManagerService(): SceneManagerServiceContract | null;
  setSceneManagerService(
    sceneManagerService: SceneManagerServiceContract
  ): void;

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
