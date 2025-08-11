import type { PointerType } from "./game-pointer-interface.js";

export interface GamePointerTouchPoint {
  pointerId: number;
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  pressing: boolean;
  pressed: boolean;
  type: PointerType;
}
