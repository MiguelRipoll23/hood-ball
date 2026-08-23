import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";

const FILL_COLOR = "rgba(0, 0, 0, 0.8)";
const DEFAULT_HEIGHT = 100;
const DEFAULT_WIDTH = 340;

/**
 * Script behaviour for a centered closeable message box. Renders a
 * rounded rectangle with text; tapping anywhere closes it.
 * Attached to CloseableMessageEntity via ScriptComponent.
 */
export class CloseableMessageScript implements ScriptLifecycle {
  content = "Whoops! Something went wrong!";
  active = false;

  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private input!: InputComponent;
  private canvas!: HTMLCanvasElement;

  private textX = 0;
  private textY = 0;

  resolveComponents(
    canvas: HTMLCanvasElement,
    transform: TransformComponent,
    animation: AnimationComponent,
    input: InputComponent,
  ): void {
    this.canvas = canvas;
    this.transform = transform;
    this.animation = animation;
    this.input = input;

    this.transform.width = DEFAULT_WIDTH;
    this.transform.height = DEFAULT_HEIGHT;
    this.setPosition();
  }

  show(value: string): void {
    this.setPosition();
    this.content = value;
    this.animation.fadeIn(0.2);
    this.active = true;
    this.input.active = true;
  }

  close(): void {
    if (!this.active) return;
    this.active = false;
    this.input.active = false;
    this.animation.fadeOut(0.2);
  }

  update(_delta: DOMHighResTimeStamp): void {
    if (this.input.pressed) {
      this.close();
    }
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.drawRoundedRectangle(context);
    this.drawText(context);
    context.restore();
  }

  private setPosition(): void {
    const t = this.transform;
    t.x = this.canvas.width / 2 - t.width / 2;
    t.y = this.canvas.height / 2 - t.height / 2;
    this.textX = t.x + t.width / 2;
    this.textY = t.y + t.height / 2 + 5;
  }

  private drawRoundedRectangle(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    const r = 6;

    ctx.fillStyle = FILL_COLOR;
    ctx.beginPath();
    ctx.moveTo(t.x + r, t.y);
    ctx.arcTo(t.x + t.width, t.y, t.x + t.width, t.y + t.height, r);
    ctx.arcTo(t.x + t.width, t.y + t.height, t.x, t.y + t.height, r);
    ctx.arcTo(t.x, t.y + t.height, t.x, t.y, r);
    ctx.arcTo(t.x, t.y, t.x + t.width, t.y, r);
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.font = "16px Arial";
    ctx.fillStyle = "WHITE";
    ctx.textAlign = "center";
    ctx.fillText(this.content, this.textX, this.textY);
  }
}
