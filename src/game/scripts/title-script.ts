import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";

export class TitleScript implements ScriptLifecycle {
  text = "Unknown";
  private transform!: TransformComponent;

  resolveTransform(transform: TransformComponent): void { this.transform = transform; }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "white";
    context.font = "lighter 38px system-ui";
    context.textAlign = "left";
    context.fillText(this.text, this.transform.x, this.transform.y);
    context.restore();
  }
}
