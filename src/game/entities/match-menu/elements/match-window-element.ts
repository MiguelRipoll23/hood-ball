import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";

export class MatchWindowElement extends BaseGameEntity {
  private readonly BORDER_RADIUS = 12;

  constructor(
    private x: number,
    private y: number,
    private width: number,
    private readonly height: number
  ) {
    super();
  }

  public setLayout(x: number, y: number, width: number): void {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 10;

    context.fillStyle = "#ffffff";
    this.drawRoundedRect(
      context,
      this.x,
      this.y,
      this.width,
      this.height,
      this.BORDER_RADIUS
    );
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
}
