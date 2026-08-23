import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";

export class ToggleScript implements ScriptLifecycle {
  toggleState: boolean;
  private transform!: TransformComponent;
  private radius = 15;

  constructor(toggleState = false) { this.toggleState = toggleState; }

  resolveTransform(transform: TransformComponent): void { this.transform = transform; }

  render(context: CanvasRenderingContext2D): void {
    const t = this.transform;
    context.fillStyle = this.toggleState ? "#4CAF50" : "#ccc";
    context.beginPath();
    context.moveTo(t.x + this.radius, t.y);
    context.arcTo(t.x + t.width, t.y, t.x + t.width, t.y + t.height, this.radius);
    context.arcTo(t.x + t.width, t.y + t.height, t.x, t.y + t.height, this.radius);
    context.arcTo(t.x, t.y + t.height, t.x, t.y, this.radius);
    context.arcTo(t.x, t.y, t.x + t.width, t.y, this.radius);
    context.closePath();
    context.fill();

    const circleX = this.toggleState
      ? t.x + t.width - t.height / 2
      : t.x + t.height / 2;
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(circleX, t.y + t.height / 2, t.height / 2 - 5, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }
}
