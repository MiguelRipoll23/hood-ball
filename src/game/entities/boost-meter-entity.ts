import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostMeterEntity extends BaseAnimatedGameEntity {
  private readonly RADIUS = 32;
  private boostLevel = 1; // target level 0..1
  private displayLevel = 1; // rendered level 0..1
  // Fill or drain the meter in roughly 0.3 seconds
  private readonly FILL_RATE = 1 / 300; // units/ms

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.setPosition(canvas.width / 2, canvas.height - this.RADIUS - 30);
  }

  public setBoostLevel(level: number): void {
    this.boostLevel = Math.max(0, Math.min(1, level));
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const diff = this.boostLevel - this.displayLevel;
    if (diff !== 0) {
      const step = this.FILL_RATE * deltaTimeStamp;
      if (Math.abs(diff) <= step) {
        this.displayLevel = this.boostLevel;
      } else {
        this.displayLevel += Math.sign(diff) * step;
      }
    }

    super.update(deltaTimeStamp);
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setPosition(x: number, y: number): void {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }


  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    const cx = this.x + this.RADIUS;
    const cy = this.y + this.RADIUS;
    const gradient = context.createLinearGradient(
      0,
      this.y + this.height,
      0,
      this.y
    );
    gradient.addColorStop(0, "#ffe066");
    gradient.addColorStop(1, LIGHT_GREEN_COLOR);

    // base background when empty
    context.beginPath();
    context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle =
      this.displayLevel === 0 ? "rgba(255,0,0,0.3)" : "rgba(0,0,0,0.2)";
    context.fill();

    if (this.displayLevel > 0) {
      const fillHeight = this.height * this.displayLevel;
      context.save();
      context.beginPath();
      context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.fillStyle = gradient;
      context.fillRect(
        this.x,
        this.y + this.height - fillHeight,
        this.width,
        fillHeight
      );
      context.restore();
    }


    context.font = `${this.RADIUS * 1.0}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000";
    context.fillText("🚀", cx, cy + 1);

    context.restore();
    super.render(context);
  }
}
