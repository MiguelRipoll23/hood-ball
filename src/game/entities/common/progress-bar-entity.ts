import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";
import { BaseGameEntity } from "@engine/entities/base-game-entity.js";

export class ProgressBarEntity extends BaseGameEntity {
  private readonly RECT_HEIGHT: number = 40;
  private readonly RECT_CORNER_RADIUS: number = 6;
  private readonly RECT_MARGIN: number = 25;
  private readonly PROGRESS_BAR_HEIGHT: number = 3;

  private rectX: number = 0;
  private rectY: number = 0;
  private rectWidth: number = 0;
  private textX: number = 0;
  private textY: number = 0;

  private progressBarY: number = 0;
  private progressBarWidth: number = 0;

  private text: string = "Loading...";
  private currentProgress: number = 0.0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.setProperties(canvas);
  }

  public update() {
    this.progressBarWidth =
      (this.canvas.width - 2 * this.rectX) * this.currentProgress;
  }

  public render(context: CanvasRenderingContext2D) {
    context.save();

    context.fillStyle = "rgba(0, 0, 0, 0.8)";

    this.roundedRect(
      context,
      this.rectX,
      this.rectY,
      this.rectWidth,
      this.RECT_HEIGHT,
      this.RECT_CORNER_RADIUS
    );

    const text = this.text;
    context.fillStyle = "white";
    context.font = "14px system-ui";
    context.textAlign = "left";
    context.fillText(text, this.textX, this.textY);

    context.fillStyle = "rgba(66, 135, 245, 0.5)";
    context.fillRect(
      this.rectX,
      this.progressBarY,
      this.rectWidth,
      this.PROGRESS_BAR_HEIGHT
    );

    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillRect(
      this.rectX,
      this.progressBarY,
      this.progressBarWidth,
      this.PROGRESS_BAR_HEIGHT
    );

    context.restore();
  }

  private setProperties(canvas: HTMLCanvasElement): void {
    this.rectX = canvas.width * 0.05;
    this.rectY = canvas.height - this.RECT_HEIGHT - this.RECT_MARGIN;
    this.rectWidth = this.canvas.width - 2 * this.rectX;
    this.textX = this.rectX + 15; // adjusted text X position
    this.textY = this.rectY + 25;
    this.progressBarY =
      this.rectY + this.RECT_HEIGHT - this.PROGRESS_BAR_HEIGHT;
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius); // corrected to height - radius
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); // corrected to width - radius
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  public setText(text: string) {
    this.text = text;
  }

  public setProgress(progress: number) {
    this.currentProgress = progress;
  }
}
