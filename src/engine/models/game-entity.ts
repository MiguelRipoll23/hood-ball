import { EntityStateType } from "../enums/entity-state-type.js";
import type { DebugSettings } from "./debug-settings.js";

export interface GameEntity {
  load(): void;
  hasLoaded(): boolean;

  getState(): EntityStateType;
  setState(state: EntityStateType): void;

  isRemoved(): boolean;
  setRemoved(removed: boolean): void;

  getOpacity(): number;
  setOpacity(opacity: number): void;

  setDebugSettings(debugSettings: DebugSettings): void;

  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
  
  // Recording/multiplayer serialization methods
  serialize(): ArrayBuffer | null;
  synchronize(arrayBuffer: ArrayBuffer): void;
}
