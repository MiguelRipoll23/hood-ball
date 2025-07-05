import { BaseGameEntity } from "../../core/entities/base-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostMeterEntity extends BaseGameEntity {
  private readonly WIDTH = 20;
  private readonly HEIGHT = 100;
  private boostLevel = 1; // 0..1
  private x: number;
  private y: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.x = this.canvas.width - this.WIDTH - 20;
    this.y = this.canvas.height - this.HEIGHT - 20;
  }

  public setBoostLevel(level: number): void {
    this.boostLevel = Math.max(0, Math.min(1, level));
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    context.strokeStyle = "white";
    context.strokeRect(this.x, this.y, this.WIDTH, this.HEIGHT);

    context.fillStyle = LIGHT_GREEN_COLOR;
    const filledHeight = this.HEIGHT * this.boostLevel;
    context.fillRect(
      this.x,
      this.y + this.HEIGHT - filledHeight,
      this.WIDTH,
      filledHeight
    );
    context.restore();
  }
}
