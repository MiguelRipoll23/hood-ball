import { LayerType } from "../../enums/layer-type.js";
import type { GameObject } from "../objects/game-object.js";
import { ScreenManagerService } from "../../services/screen-manager-service.js";

export interface GameScreen {
  isActive(): boolean;

  getUIObjects(): GameObject[];
  getSceneObjects(): GameObject[];

  getScreenManagerService(): ScreenManagerService | null;
  setScreenManagerService(screenManagerService: ScreenManagerService): void;

  load(): void;
  hasLoaded(): boolean;

  getObjectLayer(object: GameObject): LayerType;
  addObjectToSceneLayer(object: GameObject): void;

  update(deltaTimeStamp: number): void;
  render(context: CanvasRenderingContext2D): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  onTransitionStart(): void;
  onTransitionEnd(): void;
}
