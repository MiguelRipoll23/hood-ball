import type { ScriptLifecycle } from "../components/script-component.js";
import type { TransformComponent } from "../components/transform-component.js";

const LIGHT_GREEN = "#90EE90";
const SIZE = 20; const MARGIN = 20; const SPEED = 0.005;

export class LoadingIndicatorScript implements ScriptLifecycle {
  visible = false;
  private transform!: TransformComponent;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  resolveTransform(transform: TransformComponent): void { this.transform = transform; }

  update(dt: DOMHighResTimeStamp): void {
    this.transform.x = MARGIN;
    this.transform.y = this.canvas.height - SIZE - MARGIN;
    if (this.visible) this.transform.angle += dt * SPEED;
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    const t = this.transform;
    context.save();
    context.translate(t.x + SIZE / 2, t.y + SIZE / 2);
    context.rotate(t.angle);
    context.translate(-(t.x + SIZE / 2), -(t.y + SIZE / 2));
    context.strokeStyle = LIGHT_GREEN;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(t.x + SIZE / 2, t.y + SIZE / 2, SIZE / 2, 0, Math.PI * 1.5);
    context.stroke();
    context.restore();
  }
}
