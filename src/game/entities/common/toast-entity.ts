import { TimerService } from "../../../engine/services/gameplay/timer-service.js";
import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";

export class ToastEntity extends BaseGameEntity {
  private text: string = "Unknown";
  private readonly padding: number = 10;
  private readonly topMargin: number = 160; // Top margin
  private readonly cornerRadius: number = 10; // Corner radius for rounded corners
  private emColor: string = "#7ed321"; // Color for text inside <em> tags
  private parsedTextSegments: { text: string; isEm: boolean }[] = [];
  private context: CanvasRenderingContext2D;

  private timer: TimerService | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.reset();
  }

  public show(text: string, duration = 0): void {
    this.text = text;
    this.parseTextSegments();
    this.reset();
    this.getComponent(AnimationComponent)!.fadeIn(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(1, 0.2);
    this.getComponent(AnimationComponent)!.rotateTo(-2, 0.2);

    // Cancel any pending hide from a previous show so a re-shown toast
    // (e.g. a no-duration "Waiting for players...") isn't hidden by a stale timer.
    this.timer?.stop(false);
    this.timer = null;

    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
    }
  }

  public hide(): void {
    // Skip when already hidden so fadeOut's reset-to-1 doesn't flash the toast.
    if (this.opacity === 0) return;
    this.getComponent(AnimationComponent)!.fadeOut(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(0, 0.2);
    this.timer?.stop(false);
    this.timer = null;
  }

  public override reset(): void {
    this.opacity = 0;
    this.getComponent(TransformComponent)!.angle = 6;
    this.getComponent(TransformComponent)!.scale = 0;

    this.measureDimensions();
    this.setPosition();
  }

  private scriptUpdate(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.timer?.update(deltaTimeStamp);
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);
    this.applyTransformations(context);
    this.drawToastBackground(context);
    this.drawToastText(context);

    context.restore();
  }

  private parseTextSegments(): void {
    // Regex to match all <em> tags and text outside them
    const regex = /<em>(.*?)<\/em>|([^<]+)/g;
    this.parsedTextSegments = [];

    let match;

    while ((match = regex.exec(this.text)) !== null) {
      if (match[1]) {
        // Matched <em> tag
        this.parsedTextSegments.push({ text: match[1], isEm: true });
      } else if (match[2]) {
        // Matched regular text
        this.parsedTextSegments.push({ text: match[2], isEm: false });
      }
    }
  }

  private measureDimensions(): void {
    this.context.font = "16px Arial";
    this.getComponent(TransformComponent)!.width = this.parsedTextSegments.reduce((totalWidth, segment) => {
      return totalWidth + this.context.measureText(segment.text).width;
    }, this.padding * 2);
    this.getComponent(TransformComponent)!.height = 30; // Fixed height for simplicity
  }

  private setPosition(): void {
    this.getComponent(TransformComponent)!.x = (this.canvas.width - this.getComponent(TransformComponent)!.width) / 2;
    this.getComponent(TransformComponent)!.y = this.topMargin; // Set y position based on topMargin
  }

  private applyTransformations(context: CanvasRenderingContext2D): void {
    context.translate(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2);
    context.rotate((this.getComponent(TransformComponent)!.angle * Math.PI) / 180);
    context.scale(this.getComponent(TransformComponent)!.scale, this.getComponent(TransformComponent)!.scale);
    context.translate(-(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2), -(this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2));
  }

  private drawToastBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.beginPath();

    // Rounded rectangle with corner radius
    context.moveTo(this.getComponent(TransformComponent)!.x + this.cornerRadius, this.getComponent(TransformComponent)!.y);
    context.lineTo(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.cornerRadius, this.getComponent(TransformComponent)!.y);
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.cornerRadius
    );
    context.lineTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.cornerRadius
    );
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.cornerRadius,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.cornerRadius
    );
    context.lineTo(this.getComponent(TransformComponent)!.x + this.cornerRadius, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height);
    context.arcTo(
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.cornerRadius,
      this.cornerRadius
    );
    context.lineTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y + this.cornerRadius);
    context.arcTo(
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.cornerRadius,
      this.getComponent(TransformComponent)!.y,
      this.cornerRadius
    );

    context.closePath();
    context.fill();
  }

  private drawToastText(context: CanvasRenderingContext2D): void {
    let currentX = this.getComponent(TransformComponent)!.x + this.padding;

    this.parsedTextSegments.forEach((segment) => {
      context.fillStyle = segment.isEm ? this.emColor : "white";
      context.font = "16px system-ui";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(segment.text, currentX, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2);

      currentX += this.context.measureText(segment.text).width;
    });
  }
}
