import type { ScriptLifecycle } from "../../engine/components/script-component.js";

const FILL_COLOR = "rgba(0, 0, 0, 0.8)";

export class BackdropScript implements ScriptLifecycle {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = FILL_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
