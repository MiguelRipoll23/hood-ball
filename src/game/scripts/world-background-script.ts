import type { ScriptLifecycle } from "../../engine/components/script-component.js";

const BG_COLOR = "#00a000";
const BOUNDARY_COLOR = "#ffffff";
const RADIUS = 50;

export class WorldBackgroundScript implements ScriptLifecycle {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  render(context: CanvasRenderingContext2D): void {
    const cw = this.canvas.width, ch = this.canvas.height;
    const fw = cw - 25, fh = ch - 25;
    const fx = (cw - fw) / 2, fy = (ch - fh) / 2;
    const cx = cw / 2, cy = ch / 2;

    context.fillStyle = BG_COLOR;
    context.fillRect(0, 0, cw, ch);
    context.fillRect(fx, fy, fw, fh);
    context.strokeStyle = BOUNDARY_COLOR;
    context.lineWidth = 2;
    context.strokeRect(fx, fy, fw, fh);
    context.beginPath(); context.moveTo(fx, ch / 2); context.lineTo(fx + fw, ch / 2); context.stroke();
    context.beginPath(); context.arc(cx, cy, RADIUS, 0, 2 * Math.PI); context.stroke();
  }
}
