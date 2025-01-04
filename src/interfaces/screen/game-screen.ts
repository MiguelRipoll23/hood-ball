import { LayerType } from "../../enums/layer-type.js";
import { GameObject } from "../object/game-object.js";
import { ScreenManagerService } from "../../services/screen-manager-service.js";

export interface GameScreen {
  isActive(): boolean;

  getScreenManagerService(): ScreenManagerService | null;
  setScreenManagerService(screenManagerService: ScreenManagerService): void;

  loadObjects(): void;
  hasLoaded(): boolean;

  getObjectLayer(object: GameObject): LayerType;
  addObjectToSceneLayer(object: GameObject): void;

  update(deltaTimeStamp: number): void;
  render(context: CanvasRenderingContext2D): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;
  hasTransitionFinished(): void;
}
