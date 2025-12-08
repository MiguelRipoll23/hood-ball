import { BaseAnimatedGameEntity } from "../../engine/entities/base-animated-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostMeterEntity extends BaseAnimatedGameEntity {
  private readonly RADIUS = 32;
  private boostLevel = 1; // target level 0..1
  private displayLevel = 1; // rendered level 0..1
  private boostAttemptWhileEmpty = false;
  // Fill or drain the meter in roughly 0.2 seconds
  private readonly FILL_RATE_UP = 1 / 100; // units/ms
  private readonly FILL_RATE_DOWN = 1 / 200; // units/ms

  private gradient: CanvasGradient | null = null;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.setPosition(canvas.width / 2, canvas.height - this.RADIUS - 30);
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      this.updateGradient(ctx);
    }
  }

  private updateGradient(context: CanvasRenderingContext2D): void {
    this.gradient = context.createLinearGradient(
      0,
      this.y + this.height,
      0,
      this.y
    );
    this.gradient.addColorStop(0, "#ffe066");
    this.gradient.addColorStop(1, LIGHT_GREEN_COLOR);
  }

  public setBoostLevel(level: number): void {
    this.boostLevel = Math.max(0, Math.min(1, level));
  }

  public setAttemptingBoostWhileEmpty(active: boolean): void {
    this.boostAttemptWhileEmpty = active;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const diff = this.boostLevel - this.displayLevel;
    if (diff !== 0) {
      const rate = diff > 0 ? this.FILL_RATE_UP : this.FILL_RATE_DOWN;
      const step = rate * deltaTimeStamp;
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
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      this.updateGradient(ctx);
    }
  }


  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    const cx = this.x + this.RADIUS;
    const cy = this.y + this.RADIUS;

    if (!this.gradient) {
      this.updateGradient(context);
    }

    const gradient = this.gradient!;

    // base background when empty
    context.beginPath();
    context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = this.displayLevel === 0
      ? this.boostAttemptWhileEmpty
        ? "rgba(255,0,0,0.6)"
        : "rgba(255,0,0,0.3)"
      : "rgba(0,0,0,0.2)";
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
