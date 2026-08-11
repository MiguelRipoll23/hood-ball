import type { ScriptLifecycle } from "../../engine/components/script-component.js";

const BORDER_RADIUS = 12;

export class MatchWindowScript implements ScriptLifecycle {
  mx = 0; my = 0; mw = 0;
  private readonly h: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.mx = x; this.my = y; this.mw = width; this.h = height;
  }

  render(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(0, 0, 0, 0.5)"; context.shadowBlur = 20; context.shadowOffsetX = 0; context.shadowOffsetY = 10;
    context.fillStyle = "#ffffff";
    this.drawRoundedRect(context, this.mx, this.my, this.mw, this.h, BORDER_RADIUS);
    context.fill();
    context.shadowColor = "transparent"; context.shadowBlur = 0; context.shadowOffsetX = 0; context.shadowOffsetY = 0;
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
}
