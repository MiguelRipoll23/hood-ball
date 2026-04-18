import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";

export class MatchTitleBarElement extends BaseGameEntity {
  private readonly BORDER_RADIUS = 12;
  private readonly TITLE = "Match menu";

  constructor(
    private x: number,
    private y: number,
    private width: number,
    private readonly height: number,
    private readonly padding: number
  ) {
    super();
  }

  public setLayout(x: number, y: number, width: number): void {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  public override render(context: CanvasRenderingContext2D): void {
    this.renderBackground(context);
    this.renderTitle(context);
  }

  private renderBackground(context: CanvasRenderingContext2D): void {
    const radius = this.BORDER_RADIUS;

    context.save();
    context.beginPath();
    context.moveTo(this.x + radius, this.y);
    context.lineTo(this.x + this.width - radius, this.y);
    context.quadraticCurveTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + radius
    );
    context.lineTo(this.x + this.width, this.y + this.height);
    context.lineTo(this.x, this.y + this.height);
    context.lineTo(this.x, this.y + radius);
    context.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    context.closePath();
    context.clip();

    const gradient = context.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, "#4a90e2");
    gradient.addColorStop(1, "#357abd");

    context.fillStyle = gradient;
    context.fillRect(this.x, this.y, this.width, this.height);
    context.restore();
  }

  private renderTitle(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 2;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.font = "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
      this.TITLE,
      this.x + this.padding,
      this.y + this.height / 2 + 1
    );
    context.restore();
  }
}
