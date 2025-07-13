import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { TimerService } from "../../core/services/gameplay/timer-service.js";

export class ChatHistoryEntity extends BaseAnimatedGameEntity {
  private readonly padding = 10;
  private readonly cornerRadius = 8;
  private readonly lineHeight = 18;
  private messages: string[] = [];
  private timer: TimerService | null = null;
  private context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.opacity = 0;
  }

  public show(messages: string[]): void {
    this.messages = messages.slice(-5); // show last 5 messages
    this.measure();
    this.setPosition();
    this.timer?.stop(false);
    this.fadeIn(0.2);
    this.timer = new TimerService(3, this.hide.bind(this));
  }

  public hide(): void {
    this.fadeOut(0.2);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    this.timer?.update(delta);
    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0) return;
    context.save();
    this.applyOpacity(context);
    this.drawBackground(context);
    this.drawText(context);
    context.restore();
  }

  private measure(): void {
    this.context.font = "16px system-ui";
    const maxWidth = this.messages.reduce((acc, m) => Math.max(acc, this.context.measureText(m).width), 0);
    this.width = maxWidth + this.padding * 2;
    this.height = this.messages.length * this.lineHeight + this.padding * 2;
  }

  private setPosition(): void {
    this.x = 20;
    this.y = this.canvas.height - this.height - 80;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.moveTo(this.x + this.cornerRadius, this.y);
    ctx.lineTo(this.x + this.width - this.cornerRadius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.cornerRadius);
    ctx.lineTo(this.x + this.width, this.y + this.height - this.cornerRadius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.cornerRadius, this.y + this.height);
    ctx.lineTo(this.x + this.cornerRadius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.cornerRadius);
    ctx.lineTo(this.x, this.y + this.cornerRadius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + this.cornerRadius, this.y);
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "white";
    ctx.font = "16px system-ui";
    ctx.textBaseline = "top";
    let y = this.y + this.padding;
    const x = this.x + this.padding;
    for (const line of this.messages) {
      ctx.fillText(line, x, y);
      y += this.lineHeight;
    }
  }
}
