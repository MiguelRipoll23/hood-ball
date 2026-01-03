import type { GamePointerContract } from "../../../engine/interfaces/input/game-pointer-interface.js";

export interface ActionMenuContract {
  isOpen(): boolean;
  update(delta: DOMHighResTimeStamp): void;
  render(context: CanvasRenderingContext2D): void;
  handlePointerEvent(gamePointer: GamePointerContract): void;
  close(): void;
  isCancelled(): boolean;
}
