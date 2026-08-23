import type { ScriptLifecycle } from "../components/script-component.js";
import type { TransformComponent } from "../components/transform-component.js";
import type { AnimationComponent } from "../components/animation-component.js";

const HEIGHT = 35; const Y_MARGIN = 20; const TEXT_SPEED = 2;

export class NotificationScript implements ScriptLifecycle {
  nactive = false;
  text = "Whoops! Something went wrong!";
  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private textX = 0;
  private completedTimes = 0;
  private ny = Y_MARGIN;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.textX = canvas.width;
  }

  resolveComponents(transform: TransformComponent, animation: AnimationComponent): void {
    this.transform = transform;
    this.animation = animation;
  }

  show(text: string): void {
    this.text = text; this.ny = 0; this.completedTimes = 0;
    this.textX = this.canvas.width + this.ctx.measureText(this.text).width;
    this.nactive = true;
    this.animation.moveToY(Y_MARGIN, 0.2);
    this.animation.fadeIn(0.4);
  }

  update(): void {
    if (!this.nactive || this.animation.hasActiveAnimations()) return;
    this.textX -= TEXT_SPEED;
    const tw = this.ctx.measureText(this.text).width;
    if (this.textX < -tw) {
      this.completedTimes++;
      this.textX = this.canvas.width + tw;
      if (this.completedTimes === 2) {
        this.animation.moveToY(-HEIGHT, 0.2);
        this.animation.fadeOut(0.4);
        this.nactive = false;
      }
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const t = this.transform;
    context.save();
    context.fillStyle = "rgba(255, 0, 0, 0.85)";
    context.fillRect(t.x, this.ny, this.canvas.width, 1);
    context.fillRect(t.x, this.ny + HEIGHT - 1, this.canvas.width, 1);
    context.fillStyle = "rgba(0, 0, 0, 0.85)";
    context.fillRect(t.x, this.ny + 1, this.canvas.width, HEIGHT - 2);
    context.fillStyle = "#FFF";
    context.font = "20px system-ui";
    context.fillText(this.text, this.textX, this.ny + HEIGHT / 2 + 6);
    context.restore();
  }
}
