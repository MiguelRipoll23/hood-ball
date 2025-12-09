export type PointerType = "mouse" | "touch" | "pen";

import type { GamePointerTouchPoint } from "./game-pointer-touch-point-interface.js";

export interface GamePointerContract {
  /** Primary pointer X coordinate */
  getX(): number;
  /** Primary pointer Y coordinate */
  getY(): number;
  /** Primary pointer initial X coordinate */
  getInitialX(): number;
  /** Primary pointer initial Y coordinate */
  getInitialY(): number;
  /** Allow disabling default behaviour of pointer events */
  setPreventDefault(preventDefault: boolean): void;
  /** Whether the primary pointer is currently pressed */
  isPressing(): boolean;
  /** Whether the primary pointer was released on the last frame */
  isPressed(): boolean;
  /** Type of the primary pointer */
  getType(): PointerType;
  /** Returns true if the primary pointer is a touch */
  isTouch(): boolean;
  /** Reset all pointer states */
  reset(): void;
  /** Clear pressed state for all touches */
  clearPressed(): void;
  /** Get all active pointer touch points */
  getTouchPoints(): GamePointerTouchPoint[];
  /** Render debug pointer visuals */
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
