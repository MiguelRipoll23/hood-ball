import type { ScriptLifecycle } from "../../engine/components/script-component.js";

export class MainBackgroundScript implements ScriptLifecycle {
  private gradient: CanvasGradient | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  render(context: CanvasRenderingContext2D): void {
    if (!this.gradient) {
      this.gradient = context.createLinearGradient(0, 0, this.canvas.width, this.canvas.height / 2);
      this.gradient.addColorStop(0, "#000428");
      this.gradient.addColorStop(1, "#004e92");
    }
    context.fillStyle = this.gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
