import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { TimerService } from "../../engine/services/gameplay/timer-service.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";

export class HelpEntity extends BaseGameEntity {
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
    this.addComponent(new AnimationComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.reset();
  }

  public show(text: string, duration = 0): void {
    this.lines = text.split("\n");
    this.measure();
    this.reset();
    this.getComponent(AnimationComponent)!.fadeIn(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(1, 0.2);

    // Cancel any pending hide from a previous show.
    this.timer?.stop(false);
    this.timer = null;

    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
    }
  }

  public hide(): void {
    // Skip when already hidden so fadeOut's reset-to-1 doesn't flash the help box.
    if (this.opacity === 0) return;
    this.getComponent(AnimationComponent)!.fadeOut(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(0, 0.2);
    this.timer?.stop(false);
    this.timer = null;
  }

  public override reset(): void {
    this.opacity = 0;
    this.getComponent(TransformComponent)!.scale = 0;
    this.setPosition();
  }

  private scriptUpdate(delta: DOMHighResTimeStamp): void {
    this.timer?.update(delta);
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    context.translate(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2);
    context.scale(this.getComponent(TransformComponent)!.scale, this.getComponent(TransformComponent)!.scale);
    context.translate(-(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2), -(this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2));

    this.drawBackground(context);
    this.drawText(context);

    context.restore();
  }

  private measure(): void {
    this.context.font = "18px system-ui";
    const maxWidth = this.lines.reduce((acc, line) => {
      return Math.max(acc, this.context.measureText(line).width);
    }, 0);
    this.getComponent(TransformComponent)!.width = maxWidth + this.paddingX * 2;
    this.getComponent(TransformComponent)!.height = this.lines.length * this.lineHeight + this.paddingY * 2;
  }

  private setPosition(): void {
    this.getComponent(TransformComponent)!.x = (this.canvas.width - this.getComponent(TransformComponent)!.width) / 2;
    this.getComponent(TransformComponent)!.y = this.canvas.height - this.getComponent(TransformComponent)!.height - this.bottomMargin;
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height
    );
    gradient.addColorStop(0, "rgba(0,0,0,0.8)");
    gradient.addColorStop(1, "rgba(40,40,40,0.8)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.getComponent(TransformComponent)!.x + this.cornerRadius, this.getComponent(TransformComponent)!.y);
    ctx.lineTo(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.cornerRadius, this.getComponent(TransformComponent)!.y);
    ctx.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.cornerRadius
    );
    ctx.lineTo(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.cornerRadius);
    ctx.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.cornerRadius,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height
    );
    ctx.lineTo(this.getComponent(TransformComponent)!.x + this.cornerRadius, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height);
    ctx.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.cornerRadius
    );
    ctx.lineTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y + this.cornerRadius);
    ctx.quadraticCurveTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.x + this.cornerRadius, this.getComponent(TransformComponent)!.y);
    ctx.closePath();
    ctx.fill();
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "white";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let y = this.getComponent(TransformComponent)!.y + this.paddingY + this.lineHeight / 2;
    for (const line of this.lines) {
      ctx.fillText(line, this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2, y);
      y += this.lineHeight;
    }
  }
}
