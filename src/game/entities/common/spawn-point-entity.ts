import { BaseMoveableGameEntity } from "../../../core/entities/base-moveable-game-entity";

export class SpawnPointEntity extends BaseMoveableGameEntity {
  constructor(private index: number, x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }

  public getIndex(): number {
    return this.index;
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.isDebugging()) {
      context.save();

      const radius = 12;

      // Draw a larger purple circle without border
      context.beginPath();
      context.arc(this.x, this.y, radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 165, 0, 0.7)";
      context.fill();
      context.closePath();

      // Draw the index centered above the circle in white
      context.fillStyle = "white";
      context.font = "16px system-ui";
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText(`${this.index}`, this.x, this.y - radius - 4);

      context.restore();
    }
  }
}
