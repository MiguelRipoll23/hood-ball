import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";

export class SmallButtonScript implements ScriptLifecycle {
  private text: string;
  private backgroundColor: string;
  private hoverColor: string;
  private textColor: string;
  private radius: number;
  wasPressed = false;
  disabled = false;
  private transform!: TransformComponent;
  private input!: InputComponent;

  constructor(
    text: string, backgroundColor = "rgba(200, 50, 50, 0.8)",
    hoverColor = "rgba(220, 60, 60, 0.9)", textColor = "#ffffff", radius = 20,
  ) {
    this.text = text;
    this.backgroundColor = backgroundColor;
    this.hoverColor = hoverColor;
    this.textColor = textColor;
    this.radius = radius;
  }

  resolveComponents(transform: TransformComponent, input: InputComponent): void {
    this.transform = transform;
    this.input = input;
  }

  isButtonPressed(): boolean { const r = this.wasPressed; this.wasPressed = false; return r; }

  update(): void {
    if (this.disabled) return;
    if (this.input.pressed) this.wasPressed = true;
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.input.active) return;
    const t = this.transform;
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = this.disabled
      ? "rgba(180, 180, 180, 0.5)"
      : this.input.hovering ? this.hoverColor : this.backgroundColor;
    this.drawRoundedRect(context, t.x, t.y, t.width, t.height, this.radius);
    context.fill();
    context.fillStyle = this.disabled ? "rgba(255, 255, 255, 0.5)" : this.textColor;
    context.font = "bold 15px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.text, t.x + t.width / 2, t.y + t.height / 2);
    context.restore();
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
}
