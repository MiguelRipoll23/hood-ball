import { BaseGameEntity } from "../../core/entities/base-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

const BOOST_GRADIENT_START = '#ffe066';

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

    // Background
    context.fillStyle = 'rgba(0,0,0,0.4)';
    context.fillRect(this.x - 2, this.y - 2, this.WIDTH + 4, this.HEIGHT + 4);

    // Border
    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.WIDTH, this.HEIGHT);

    // Fill gradient
    const gradient = context.createLinearGradient(
      this.x,
      this.y + this.HEIGHT,
      this.x,
      this.y
    );
    gradient.addColorStop(0, BOOST_GRADIENT_START);
    gradient.addColorStop(1, LIGHT_GREEN_COLOR);

    const filledHeight = this.HEIGHT * this.boostLevel;
    context.fillStyle = gradient;
    context.fillRect(
      this.x,
      this.y + this.HEIGHT - filledHeight,
      this.WIDTH,
      filledHeight
    );

    context.restore();
  }
}
