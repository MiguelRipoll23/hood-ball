import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

export class OnlinePlayersEntity extends BaseMoveableGameEntity {
  private onlinePlayers = 0;
  private readonly LABEL = "ONLINE PLAYERS";
  private readonly RECT_CORNER_RADIUS: number = 6;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height - 40;
    this.width = 0;
    this.height = 0;
  }

  public setOnlinePlayers(total: number): void {
    this.onlinePlayers = total;
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    const y = this.canvas.height - 40;
    const labelX = this.canvas.width / 2;

    context.font = "bold 20px system-ui";
    context.fillStyle = "#4a90e2";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(this.LABEL, labelX, y);

    const labelMetrics = context.measureText(this.LABEL);
    const padding = 10;
    const playersText = String(this.onlinePlayers);
    const textWidth = context.measureText(playersText).width;
    const rectPadding = 6;
    const rectHeight = 24;
    const rectWidth = textWidth + rectPadding * 2;
    const rectX = labelX + labelMetrics.width / 2 + padding + rectWidth / 2;

    this.width = labelMetrics.width + padding + rectWidth;
    this.height = rectHeight;
    this.x = labelX - labelMetrics.width / 2 + this.width / 2;
    this.y = y;

    this.roundedRect(
      context,
      rectX - rectWidth / 2,
      y - rectHeight / 2,
      rectWidth,
      rectHeight,
      this.RECT_CORNER_RADIUS
    );
    context.strokeStyle = "#4a90e2";
    context.lineWidth = 2;
    context.stroke();

    context.fillText(playersText, rectX, y);

    context.restore();
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
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}
