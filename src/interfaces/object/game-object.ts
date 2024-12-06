import { ObjectStateType } from "../../enums/object-state-type.js";

export interface GameObject {
  load(): void;
  hasLoaded(): boolean;

  getState(): ObjectStateType;
  setState(state: ObjectStateType): void;

  isRemoved(): boolean;
  setRemoved(removed: boolean): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  setDebug(debug: boolean): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
}
