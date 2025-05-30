import { ObjectStateType } from "../../enums/object-state-type.js";
import type { DebugSettings } from "../../models/debug-settings.js";

export interface GameObject {
  load(): void;
  hasLoaded(): boolean;

  getState(): ObjectStateType;
  setState(state: ObjectStateType): void;

  isRemoved(): boolean;
  setRemoved(removed: boolean): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  setDebugSettings(debugSettings: DebugSettings): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
