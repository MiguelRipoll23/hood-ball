import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";

const BOX_W = 300, BOX_H = 130, CORNER_R = 8;
const BTN_W = 90, BTN_H = 36, BTN_GAP = 12, H_PAD = 20, LINE_H = 24;

export class ConfirmationMessageScript implements ScriptLifecycle {
  question = "";
  isOpened = false;
  confirmed = false;
  cancelled = false;
  private input!: InputComponent;
  private canvas!: HTMLCanvasElement;

  private boxX = 0; private boxY = 0; private textX = 0; private textY = 0;
  private confirmBtnX = 0; private confirmBtnY = 0; private cancelBtnX = 0; private cancelBtnY = 0;
  private confirmHovered = false; private cancelHovered = false;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  resolveInput(input: InputComponent): void { this.input = input; }

  show(question: string): void {
    this.question = question; this.isOpened = true;
    this.confirmed = false; this.cancelled = false;
    this.input.active = true;
    this.calculateLayout();
  }

  close(): void { this.isOpened = false; this.input.active = false; }

  isConfirmed(): boolean { const r = this.confirmed; this.confirmed = false; return r; }
  isCancelled(): boolean { const r = this.cancelled; this.cancelled = false; return r; }

  handlePointerEvent(gamePointer: GamePointerContract): void {
    if (!this.isOpened) return;
    const touches = gamePointer.getTouchPoints();
    this.confirmHovered = false; this.cancelHovered = false;
    this.input.pressed = false; this.input.hovering = false;
    if (touches.length === 0) return;

    for (const touch of touches) {
      const inConfirm = this.ptInRect(touch.x, touch.y, this.confirmBtnX, this.confirmBtnY, BTN_W, BTN_H);
      const inCancel = this.ptInRect(touch.x, touch.y, this.cancelBtnX, this.cancelBtnY, BTN_W, BTN_H);
      if (inConfirm || inCancel) {
        this.input.hovering = true;
        if (inConfirm) this.confirmHovered = true;
        if (inCancel) this.cancelHovered = true;
        if (touch.pressed) { this.input.pressed = true; this.confirmHovered = inConfirm; this.cancelHovered = inCancel; break; }
      }
    }
  }

  update(): void {
    if (!this.isOpened) return;
    if (this.input.pressed) {
      if (this.confirmHovered) this.confirmed = true;
      else if (this.cancelHovered) this.cancelled = true;
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isOpened) return;
    context.save();
    this.renderBox(context); this.renderText(context); this.renderButtons(context);
    context.restore();
  }

  private calculateLayout(): void {
    this.boxX = this.canvas.width / 2 - BOX_W / 2; this.boxY = this.canvas.height / 2 - BOX_H / 2;
    this.textX = this.canvas.width / 2; this.textY = this.boxY + 32;
    const by = this.boxY + BOX_H - BTN_H - 10;
    const tw = BTN_W * 2 + BTN_GAP; const sx = this.canvas.width / 2 - tw / 2;
    this.confirmBtnX = sx; this.confirmBtnY = by; this.cancelBtnX = sx + BTN_W + BTN_GAP; this.cancelBtnY = by;
  }

  private renderBox(ctx: CanvasRenderingContext2D): void {
    const { boxX: x, boxY: y } = this;
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath(); ctx.moveTo(x + CORNER_R, y);
    ctx.arcTo(x + BOX_W, y, x + BOX_W, y + BOX_H, CORNER_R);
    ctx.arcTo(x + BOX_W, y + BOX_H, x, y + BOX_H, CORNER_R);
    ctx.arcTo(x, y + BOX_H, x, y, CORNER_R);
    ctx.arcTo(x, y, x + BOX_W, y, CORNER_R); ctx.closePath(); ctx.fill();
  }

  private renderText(ctx: CanvasRenderingContext2D): void {
    ctx.font = "14px system-ui"; ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const maxW = BOX_W - H_PAD * 2; const lines = this.wrapText(ctx, this.question, maxW);
    const totalH = lines.length * LINE_H;
    let sy = this.textY - totalH / 2 + LINE_H / 2;
    for (const line of lines) { ctx.fillText(line, this.textX, sy, maxW); sy += LINE_H; }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const words = text.split(" "); const lines: string[] = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private renderButtons(ctx: CanvasRenderingContext2D): void {
    this.renderBtn(ctx, this.confirmBtnX, this.confirmBtnY, "Yes", this.confirmHovered ? "#2563EB" : "#3B82F6");
    this.renderBtn(ctx, this.cancelBtnX, this.cancelBtnY, "No", this.cancelHovered ? "#7C3AED" : "#8B5CF6");
  }

  private renderBtn(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string): void {
    const r = 5; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + BTN_W - r, y);
    ctx.quadraticCurveTo(x + BTN_W, y, x + BTN_W, y + r); ctx.lineTo(x + BTN_W, y + BTN_H - r);
    ctx.quadraticCurveTo(x + BTN_W, y + BTN_H, x + BTN_W - r, y + BTN_H); ctx.lineTo(x + r, y + BTN_H);
    ctx.quadraticCurveTo(x, y + BTN_H, x, y + BTN_H - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "white"; ctx.font = "bold 15px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, x + BTN_W / 2, y + BTN_H / 2);
  }

  private ptInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
