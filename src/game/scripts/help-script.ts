import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import { TimerService } from "../../engine/services/gameplay/timer-service.js";

/**
 * Script behaviour for the help text box. Renders a rounded-rectangle
 * background with multi-line instructional text, with optional auto-hide timer.
 * Attached to HelpEntity via ScriptComponent.
 */
export class HelpScript implements ScriptLifecycle {
  private readonly paddingX = 20;
  private readonly paddingY = 10;
  private readonly cornerRadius = 12;
  private readonly bottomMargin = 40;
  private readonly lineHeight = 24;

  lines: string[] = [];
  private timer: TimerService | null = null;

  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  resolveComponents(
    canvas: HTMLCanvasElement,
    transform: TransformComponent,
    animation: AnimationComponent,
  ): void {
    this.canvas = canvas;
    this.transform = transform;
    this.animation = animation;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  init(): void {
    this.transform.scale = 0;
    this.setPosition();
  }

  show(text: string, duration = 0): void {
    this.lines = text.split("\n");
    this.measure();
    this.transform.scale = 0;
    this.setPosition();
    this.animation.fadeIn(0.2);
    this.animation.scaleTo(1, 0.2);

    this.timer?.stop(false);
    this.timer = null;

    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
    }
  }

  hide(): void {
    this.animation.fadeOut(0.2);
    this.animation.scaleTo(0, 0.2);
    this.timer?.stop(false);
    this.timer = null;
  }

  update(delta: DOMHighResTimeStamp): void {
    this.timer?.update(delta);
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    context.translate(
      this.transform.x + this.transform.width / 2,
      this.transform.y + this.transform.height / 2,
    );
    context.scale(this.transform.scale, this.transform.scale);
    context.translate(
      -(this.transform.x + this.transform.width / 2),
      -(this.transform.y + this.transform.height / 2),
    );

    this.drawBackground(context);
    this.drawText(context);

    context.restore();
  }

  private measure(): void {
    this.ctx.font = "18px system-ui";
    const maxWidth = this.lines.reduce(
      (acc, line) => Math.max(acc, this.ctx.measureText(line).width),
      0,
    );
    this.transform.width = maxWidth + this.paddingX * 2;
    this.transform.height =
      this.lines.length * this.lineHeight + this.paddingY * 2;
  }

  private setPosition(): void {
    this.transform.x =
      (this.canvas.width - this.transform.width) / 2;
    this.transform.y =
      this.canvas.height - this.transform.height - this.bottomMargin;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    const gradient = ctx.createLinearGradient(
      t.x, t.y, t.x, t.y + t.height,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0.8)");
    gradient.addColorStop(1, "rgba(40,40,40,0.8)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(t.x + this.cornerRadius, t.y);
    ctx.lineTo(t.x + t.width - this.cornerRadius, t.y);
    ctx.quadraticCurveTo(
      t.x + t.width, t.y,
      t.x + t.width, t.y + this.cornerRadius,
    );
    ctx.lineTo(t.x + t.width, t.y + t.height - this.cornerRadius);
    ctx.quadraticCurveTo(
      t.x + t.width, t.y + t.height,
      t.x + t.width - this.cornerRadius, t.y + t.height,
    );
    ctx.lineTo(t.x + this.cornerRadius, t.y + t.height);
    ctx.quadraticCurveTo(
      t.x, t.y + t.height,
      t.x, t.y + t.height - this.cornerRadius,
    );
    ctx.lineTo(t.x, t.y + this.cornerRadius);
    ctx.quadraticCurveTo(
      t.x, t.y,
      t.x + this.cornerRadius, t.y,
    );
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    ctx.fillStyle = "white";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let y = t.y + this.paddingY + this.lineHeight / 2;
    for (const line of this.lines) {
      ctx.fillText(line, t.x + t.width / 2, y);
      y += this.lineHeight;
    }
  }
}
