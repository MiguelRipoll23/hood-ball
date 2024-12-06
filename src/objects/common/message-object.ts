import { BaseAnimatedGameObject } from "../base/base-animated-object.js";

export class MessageObject extends BaseAnimatedGameObject {
  private readonly FILL_COLOR = "rgba(0, 0, 0, 0.8)";
  private readonly DEFAULT_HEIGHT = 100;
  private readonly DEFAULT_WIDTH = 340;

  private textX = 0;
  private textY = 0;

  private width = this.DEFAULT_WIDTH;
  private height = this.DEFAULT_HEIGHT;
  private content = "Unknown";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.setInitialValues();
  }

  public show(value: string): void {
    this.content = value;

    if (this.opacity === 0) {
      this.fadeIn(0.2);
    }
  }

  public hide(): void {
    if (this.opacity === 0) {
      console.warn("MessageObject is already hidden");
      return;
    }

    this.fadeOut(0.2);
  }

  public render(context: CanvasRenderingContext2D): void {
    context.globalAlpha = this.opacity;
    this.drawRoundedRectangle(context);
    this.drawText(context);
    context.globalAlpha = this.opacity;
  }

  private drawRoundedRectangle(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.FILL_COLOR;
    context.beginPath();
    context.moveTo(this.x + 6, this.y);
    context.arcTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.height,
      6,
    );
    context.arcTo(
      this.x + this.width,
      this.y + this.height,
      this.x,
      this.y + this.height,
      6,
    );
    context.arcTo(this.x, this.y + this.height, this.x, this.y, 6);
    context.arcTo(this.x, this.y, this.x + this.width, this.y, 6);
    context.closePath();
    context.fill();
  }

  private drawText(context: CanvasRenderingContext2D): void {
    context.font = "16px Arial";
    context.fillStyle = "WHITE";
    context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);
  }

  private setInitialValues(): void {
    this.opacity = 0;
    this.setPosition();
  }

  private setPosition(): void {
    this.x = this.canvas.width / 2 - (this.width / 2);
    this.y = this.canvas.height / 2 - (this.height / 2);
    this.textX = this.x + this.width / 2;
    this.textY = this.y + this.height / 2 + 5;
  }
}
