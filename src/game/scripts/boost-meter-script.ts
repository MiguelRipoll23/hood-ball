import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostMeterScript implements ScriptLifecycle {
  private readonly RADIUS = 32;
  boostLevel = 1;
  displayLevel = 1;
  boostAttemptWhileEmpty = false;
  private readonly FILL_RATE_UP = 1 / 100;
  private readonly FILL_RATE_DOWN = 1 / 200;

  private gradient: CanvasGradient | null = null;
  x = 0;
  y = 0;
  globalAlpha = 1;

  constructor() {}

  updateGradient(context: CanvasRenderingContext2D): void {
    this.gradient = context.createLinearGradient(0, this.y + this.RADIUS * 2, 0, this.y);
    this.gradient.addColorStop(0, "#ffe066");
    this.gradient.addColorStop(1, LIGHT_GREEN_COLOR);
  }

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
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
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    if (this.globalAlpha < 1) context.globalAlpha = this.globalAlpha;

    const cx = this.x + this.RADIUS;
    const cy = this.y + this.RADIUS;
    const width = this.RADIUS * 2;
    const height = this.RADIUS * 2;

    if (!this.gradient) this.updateGradient(context);

    context.beginPath();
    context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle =
      this.displayLevel === 0
        ? this.boostAttemptWhileEmpty
          ? "rgba(255,0,0,0.6)"
          : "rgba(255,0,0,0.3)"
        : "rgba(0,0,0,0.2)";
    context.fill();

    if (this.displayLevel > 0) {
      const fillHeight = height * this.displayLevel;
      context.save();
      context.beginPath();
      context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.fillStyle = this.gradient!;
      context.fillRect(this.x, this.y + height - fillHeight, width, fillHeight);
      context.restore();
    }

    context.font = `${this.RADIUS * 1.0}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000";
    context.fillText("🚀", cx, cy + 1);

    context.restore();
  }
}
