import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";

const FILL_COLOR = "rgba(0, 0, 0, 0.8)";
const DEFAULT_H = 100; const DEFAULT_W = 340;

export class MessageScript implements ScriptLifecycle {
  content = "Unknown";
  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas!: HTMLCanvasElement;
  private textX = 0; private textY = 0;

  resolveComponents(canvas: HTMLCanvasElement, transform: TransformComponent, animation: AnimationComponent): void {
    this.canvas = canvas; this.transform = transform; this.animation = animation;
    this.transform.width = DEFAULT_W; this.transform.height = DEFAULT_H;
    this.setPosition();
  }

  show(value: string): void {
    this.content = value;
    this.animation.fadeIn(0.2);
  }

  hide(): void { this.animation.fadeOut(0.2); }

  private setPosition(): void {
    this.transform.x = this.canvas.width / 2 - this.transform.width / 2;
    this.transform.y = this.canvas.height / 2 - this.transform.height / 2;
    this.textX = this.transform.x + this.transform.width / 2;
    this.textY = this.transform.y + this.transform.height / 2 + 5;
  }

  render(context: CanvasRenderingContext2D): void {
    const t = this.transform;
    context.fillStyle = FILL_COLOR;
    context.beginPath(); context.moveTo(t.x + 6, t.y);
    context.arcTo(t.x + t.width, t.y, t.x + t.width, t.y + t.height, 6);
    context.arcTo(t.x + t.width, t.y + t.height, t.x, t.y + t.height, 6);
    context.arcTo(t.x, t.y + t.height, t.x, t.y, 6);
    context.arcTo(t.x, t.y, t.x + t.width, t.y, 6);
    context.closePath(); context.fill();
    context.font = "16px Arial"; context.fillStyle = "WHITE"; context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);
  }
}
