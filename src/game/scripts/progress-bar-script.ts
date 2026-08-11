import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

const RECT_HEIGHT = 40; const RECT_CORNER_R = 6; const RECT_MARGIN = 25; const PROGRESS_BAR_HEIGHT = 3;

export class ProgressBarScript implements ScriptLifecycle {
  text = "Loading...";
  currentProgress = 0;
  private canvas: HTMLCanvasElement;

  private rectX = 0; private rectY = 0; private rectWidth = 0;
  private textX = 0; private textY = 0;
  private progressBarY = 0; private progressBarWidth = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.rectX = canvas.width * 0.05;
    this.rectY = canvas.height - RECT_HEIGHT - RECT_MARGIN;
    this.rectWidth = canvas.width - 2 * this.rectX;
    this.textX = this.rectX + 15;
    this.textY = this.rectY + 25;
    this.progressBarY = this.rectY + RECT_HEIGHT - PROGRESS_BAR_HEIGHT;
  }

  update(): void {
    this.progressBarWidth = (this.canvas.width - 2 * this.rectX) * this.currentProgress;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.roundedRect(context, this.rectX, this.rectY, this.rectWidth, RECT_HEIGHT, RECT_CORNER_R);
    context.fillStyle = "white"; context.font = "14px system-ui"; context.textAlign = "left";
    context.fillText(this.text, this.textX, this.textY);
    context.fillStyle = "rgba(66, 135, 245, 0.5)";
    context.fillRect(this.rectX, this.progressBarY, this.rectWidth, PROGRESS_BAR_HEIGHT);
    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillRect(this.rectX, this.progressBarY, this.progressBarWidth, PROGRESS_BAR_HEIGHT);
    context.restore();
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
  }
}
