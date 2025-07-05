import { LayerType } from "../../core/constants/layer-type.js";
import type { GameEntity } from "../entities/game-entity.js";
import type { ScreenManager } from "./screen-manager.js";

export interface GameScreen {
  isActive(): boolean;

  getUIObjects(): GameEntity[];
  getSceneObjects(): GameEntity[];

  getScreenManagerService(): ScreenManager | null;
  setScreenManagerService(screenManagerService: ScreenManager): void;

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
