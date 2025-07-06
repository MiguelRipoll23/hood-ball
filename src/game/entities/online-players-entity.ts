import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

export class OnlinePlayersEntity extends BaseMoveableGameEntity {
  private onlinePlayers = 0;
  private readonly LABEL = "ONLINE PLAYERS";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height - 40;
  }

  public setOnlinePlayers(total: number): void {
    this.onlinePlayers = total;
  }

  public override render(context: CanvasRenderingContext2D): void {
    const y = this.y;
    const labelX = this.x;

    context.font = "bold 20px system-ui";
    context.fillStyle = "#4a90e2";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(this.LABEL, labelX, y);

    const metrics = context.measureText(this.LABEL);
    const padding = 10;
    const radius = 12;
    const circleX = labelX + metrics.width / 2 + padding + radius;

    context.beginPath();
    context.arc(circleX, y, radius, 0, Math.PI * 2);
    context.closePath();
    context.strokeStyle = "#4a90e2";
    context.lineWidth = 2;
    context.stroke();

    context.fillText(String(this.onlinePlayers), circleX, y);
  }
}
