import { BaseAnimatedGameObject } from "../base/base-animated-object.js";

export class NotificationObject extends BaseAnimatedGameObject {
  private readonly HEIGHT = 35;
  private readonly Y_MARGIN = 20;
  private readonly TEXT_SPEED = 2;

  private context: CanvasRenderingContext2D;
  private active: boolean = false;
  private textX = 0;
  private completedTimes = 0;
  private text = "Whoops! Something went wrong!";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.y = this.Y_MARGIN;
    this.textX = this.canvas.width;
    this.opacity = 0;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.active) {
      this.updateTextPosition();
    }

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);

    // Draw red borders
    context.fillStyle = "rgba(255, 0, 0, 0.85)";
    context.fillRect(this.x, this.y, this.canvas.width, 1); // Top border
    context.fillRect(this.x, this.y + this.HEIGHT - 1, this.canvas.width, 1); // Bottom border

    // Draw black rectangle
    context.fillStyle = "rgba(0, 0, 0, 0.85)";
    context.fillRect(this.x, this.y + 1, this.canvas.width, this.HEIGHT - 2); // Main rectangle

    // Draw text
    context.fillStyle = "#FFF";
    context.font = "20px system-ui";
    context.fillText(this.text, this.textX, this.y + this.HEIGHT / 2 + 6);

    context.restore();
  }

  public show(text: string): void {
    this.reset();
    this.text = text;
    this.moveToY(this.Y_MARGIN, 0.2);
    this.fadeIn(0.4);
  }

  public override reset(): void {
    super.reset();

    this.y = 0;
    this.completedTimes = 0;
    this.textX = this.canvas.width + this.context.measureText(this.text).width;
    this.active = true;
  }

  private updateTextPosition(): void {
    if (this.animations.length > 0) {
      return;
    }

    this.textX -= this.TEXT_SPEED;

    // Reset position if text is out of screen
    const textWidth = this.context.measureText(this.text).width;

    if (this.textX < -textWidth) {
      this.completedTimes++;
      this.textX = this.canvas.width + textWidth;

      if (this.completedTimes === 2) {
        this.close();
      }
    }
  }

  private close(): void {
    this.moveToY(-this.HEIGHT, 0.2);
    this.fadeOut(0.4);
    this.active = false;
  }
}
