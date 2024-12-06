import { TimerService } from "../../services/timer-service.js";
import { BaseAnimatedGameObject } from "../base/base-animated-object.js";

export class ToastObject extends BaseAnimatedGameObject {
  private text: string = "Unknown";
  private width: number = 0;
  private height: number = 0;
  private readonly padding: number = 10;
  private readonly topMargin: number = 160; // Top margin
  private readonly cornerRadius: number = 10; // Corner radius for rounded corners
  private emColor: string = "#7ed321"; // Color for text inside <em> tags
  private parsedTextSegments: { text: string; isEm: boolean }[] = [];
  private context: CanvasRenderingContext2D;

  private timer: TimerService | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.reset();
  }

  public show(text: string, duration = 0): void {
    this.text = text;
    this.parseTextSegments();
    this.reset();
    this.fadeIn(0.2);
    this.scaleTo(1, 0.2);
    this.rotateTo(-2, 0.2);

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
    this.angle = 6;
    this.scale = 0;

    this.measureDimensions();
    this.setPosition();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.timer?.update(deltaTimeStamp);
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
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
    this.width = this.parsedTextSegments.reduce((totalWidth, segment) => {
      return totalWidth + this.context.measureText(segment.text).width;
    }, this.padding * 2);
    this.height = 30; // Fixed height for simplicity
  }

  private setPosition(): void {
    this.x = (this.canvas.width - this.width) / 2;
    this.y = this.topMargin; // Set y position based on topMargin
  }

  private applyOpacity(context: CanvasRenderingContext2D): void {
    context.globalAlpha = this.opacity;
  }

  private applyTransformations(context: CanvasRenderingContext2D): void {
    context.translate(this.x + this.width / 2, this.y + this.height / 2);
    context.rotate((this.angle * Math.PI) / 180);
    context.scale(this.scale, this.scale);
    context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
  }

  private drawToastBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.beginPath();

    // Rounded rectangle with corner radius
    context.moveTo(this.x + this.cornerRadius, this.y);
    context.lineTo(this.x + this.width - this.cornerRadius, this.y);
    context.arcTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.height,
      this.cornerRadius
    );
    context.lineTo(
      this.x + this.width,
      this.y + this.height - this.cornerRadius
    );
    context.arcTo(
      this.x + this.width,
      this.y + this.height,
      this.x + this.width - this.cornerRadius,
      this.y + this.height,
      this.cornerRadius
    );
    context.lineTo(this.x + this.cornerRadius, this.y + this.height);
    context.arcTo(
      this.x,
      this.y + this.height,
      this.x,
      this.y + this.height - this.cornerRadius,
      this.cornerRadius
    );
    context.lineTo(this.x, this.y + this.cornerRadius);
    context.arcTo(
      this.x,
      this.y,
      this.x + this.cornerRadius,
      this.y,
      this.cornerRadius
    );

    context.closePath();
    context.fill();
  }

  private drawToastText(context: CanvasRenderingContext2D): void {
    let currentX = this.x + this.padding;

    this.parsedTextSegments.forEach((segment) => {
      context.fillStyle = segment.isEm ? this.emColor : "white";
      context.font = "16px system-ui";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(segment.text, currentX, this.y + this.height / 2);

      currentX += this.context.measureText(segment.text).width;
    });
  }
}
