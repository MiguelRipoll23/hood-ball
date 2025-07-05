import { LayerType } from "../../core/constants/layer-type.js";
import type { GameEntity } from "../entities/game-entity.js";
import type { SceneManager } from "./scene-manager.js";

export interface GameScene {
  isActive(): boolean;

  getUIObjects(): GameEntity[];
  getSceneObjects(): GameEntity[];

  getScreenManagerService(): SceneManager | null;
  setScreenManagerService(screenManagerService: SceneManager): void;

  load(): void;
  hasLoaded(): boolean;

  getObjectLayer(object: GameEntity): LayerType;
  addObjectToSceneLayer(object: GameEntity): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  onTransitionStart(): void;
  onTransitionEnd(): void;
}
