import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { TimerService } from "@engine/services/time/timer-service.js";

export class HelpEntity extends BaseAnimatedGameEntity {
  private readonly paddingX = 20;
  private readonly paddingY = 10;
  private readonly cornerRadius = 12;
  private readonly bottomMargin = 40;
  private readonly lineHeight = 24;

  private lines: string[] = [];
  private timer: TimerService | null = null;
  private context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.reset();
  }

  public show(text: string, duration = 0): void {
    this.lines = text.split("\n");
    this.measure();
    this.reset();
    this.fadeIn(0.2);
    this.scaleTo(1, 0.2);
    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
    }
  }

  public hide(): void {
    this.fadeOut(0.2);
    this.scaleTo(0, 0.2);
  }

  public override reset(): void {
    this.opacity = 0;
    this.scale = 0;
    this.setPosition();
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.timer?.update(delta);
    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    context.translate(this.x + this.width / 2, this.y + this.height / 2);
    context.scale(this.scale, this.scale);
    context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

    this.drawBackground(context);
    this.drawText(context);

    context.restore();
  }

  private measure(): void {
    this.context.font = "18px system-ui";
    const maxWidth = this.lines.reduce((acc, line) => {
      return Math.max(acc, this.context.measureText(line).width);
    }, 0);
    this.width = maxWidth + this.paddingX * 2;
    this.height = this.lines.length * this.lineHeight + this.paddingY * 2;
  }

  private setPosition(): void {
    this.x = (this.canvas.width - this.width) / 2;
    this.y = this.canvas.height - this.height - this.bottomMargin;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, "rgba(0,0,0,0.8)");
    gradient.addColorStop(1, "rgba(40,40,40,0.8)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x + this.cornerRadius, this.y);
    ctx.lineTo(this.x + this.width - this.cornerRadius, this.y);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.cornerRadius
    );
    ctx.lineTo(this.x + this.width, this.y + this.height - this.cornerRadius);
    ctx.quadraticCurveTo(
      this.x + this.width,
      this.y + this.height,
      this.x + this.width - this.cornerRadius,
      this.y + this.height
    );
    ctx.lineTo(this.x + this.cornerRadius, this.y + this.height);
    ctx.quadraticCurveTo(
      this.x,
      this.y + this.height,
      this.x,
      this.y + this.height - this.cornerRadius
    );
    ctx.lineTo(this.x, this.y + this.cornerRadius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.cornerRadius, this.y);
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "white";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let y = this.y + this.paddingY + this.lineHeight / 2;
    for (const line of this.lines) {
      ctx.fillText(line, this.x + this.width / 2, y);
      y += this.lineHeight;
    }
  }
}
