import type { ScriptLifecycle } from "../../engine/components/script-component.js";

export class LoadingBackgroundScript implements ScriptLifecycle {
  private gradientOffset = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  update(delta: DOMHighResTimeStamp): void {
    this.gradientOffset += delta * 0.01;
    if (this.gradientOffset > this.canvas.width) this.gradientOffset = 0;
  }

  render(context: CanvasRenderingContext2D): void {
    const g = context.createLinearGradient(this.gradientOffset, 0, this.canvas.width + this.gradientOffset, this.canvas.height / 2);
    g.addColorStop(0, "#000428"); g.addColorStop(1, "#004e92");
    context.fillStyle = g;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
