import type { ScriptLifecycle } from "../../engine/components/script-component.js";

const BORDER_RADIUS = 12;
const TITLE = "Match menu";

export class MatchTitleBarScript implements ScriptLifecycle {
  mx = 0; my = 0; mw = 0;
  private readonly h: number;
  private readonly padding: number;

  constructor(x: number, y: number, width: number, height: number, padding: number) {
    this.mx = x; this.my = y; this.mw = width; this.h = height; this.padding = padding;
  }

  render(context: CanvasRenderingContext2D): void {
    const r = BORDER_RADIUS;
    context.save();
    context.beginPath();
    context.moveTo(this.mx + r, this.my); context.lineTo(this.mx + this.mw - r, this.my);
    context.quadraticCurveTo(this.mx + this.mw, this.my, this.mx + this.mw, this.my + r);
    context.lineTo(this.mx + this.mw, this.my + this.h); context.lineTo(this.mx, this.my + this.h);
    context.lineTo(this.mx, this.my + r);
    context.quadraticCurveTo(this.mx, this.my, this.mx + r, this.my);
    context.closePath(); context.clip();

    const g = context.createLinearGradient(this.mx, this.my, this.mx, this.my + this.h);
    g.addColorStop(0, "#4a90e2"); g.addColorStop(1, "#357abd");
    context.fillStyle = g; context.fillRect(this.mx, this.my, this.mw, this.h);
    context.restore();

    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0, 0, 0, 0.3)"; context.shadowBlur = 2; context.shadowOffsetX = 1; context.shadowOffsetY = 1;
    context.font = "bold 24px system-ui"; context.textAlign = "left"; context.textBaseline = "middle";
    context.fillText(TITLE, this.mx + this.padding, this.my + this.h / 2 + 1);
  }
}
