import { LayerType } from "../../enums/layer-type.js";
import type { GameObject } from "../objects/game-object.js";
import type { ScreenManager } from "./screen-manager.js";

export interface GameScreen {
  isActive(): boolean;

  getUIObjects(): GameObject[];
  getSceneObjects(): GameObject[];

  getScreenManagerService(): ScreenManager | null;
  setScreenManagerService(screenManagerService: ScreenManager): void;

  load(): void;
  hasLoaded(): boolean;

  getObjectLayer(object: GameObject): LayerType;
  addObjectToSceneLayer(object: GameObject): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  onTransitionStart(): void;
  onTransitionEnd(): void;
}
