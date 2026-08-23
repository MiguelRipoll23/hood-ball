import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import { TimerService } from "../../engine/services/gameplay/timer-service.js";

export class ToastScript implements ScriptLifecycle {
  text = "Unknown";
  private padding = 10;
  private topMargin = 160;
  private cornerRadius = 10;
  private emColor = "#7ed321";
  private parsedTextSegments: { text: string; isEm: boolean }[] = [];
  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private timer: TimerService | null = null;
  private opacity = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  resolveComponents(transform: TransformComponent, animation: AnimationComponent): void {
    this.transform = transform;
    this.animation = animation;
  }

  init(): void { this.reset(); }

  getOpacity(): number { return this.opacity; }
  setOpacityFromEntity(v: number): void { this.opacity = v; }

  show(text: string, duration = 0): void {
    if (duration === 0 && this.text === text && this.opacity > 0) return;
    this.text = text;
    this.parseTextSegments();
    this.reset();
    this.animation.fadeIn(0.2);
    this.animation.scaleTo(1, 0.2);
    this.animation.rotateTo(-2, 0.2);
    this.timer?.stop(false);
    this.timer = null;
    if (duration > 0) this.timer = new TimerService(duration, this.hide.bind(this));
  }

  hide(): void {
    if (this.opacity === 0) return;
    this.animation.fadeOut(0.2);
    this.animation.scaleTo(0, 0.2);
    this.timer?.stop(false);
    this.timer = null;
  }

  reset(): void {
    this.opacity = 0;
    this.transform.angle = 6;
    this.transform.scale = 0;
    this.measureDimensions();
    this.setPosition();
  }

  update(delta: DOMHighResTimeStamp): void { this.timer?.update(delta); }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyTransformations(context);
    this.drawToastBackground(context);
    this.drawToastText(context);
    context.restore();
  }

  private parseTextSegments(): void {
    const regex = /<em>(.*?)<\/em>|([^<]+)/g;
    this.parsedTextSegments = [];
    let match;
    while ((match = regex.exec(this.text)) !== null) {
      if (match[1]) this.parsedTextSegments.push({ text: match[1], isEm: true });
      else if (match[2]) this.parsedTextSegments.push({ text: match[2], isEm: false });
    }
  }

  private measureDimensions(): void {
    this.ctx.font = "16px Arial";
    this.transform.width = this.parsedTextSegments.reduce((w, s) => w + this.ctx.measureText(s.text).width, this.padding * 2);
    this.transform.height = 30;
  }

  private setPosition(): void {
    this.transform.x = (this.canvas.width - this.transform.width) / 2;
    this.transform.y = this.topMargin;
  }

  private applyTransformations(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    ctx.translate(t.x + t.width / 2, t.y + t.height / 2);
    ctx.rotate((t.angle * Math.PI) / 180);
    ctx.scale(t.scale, t.scale);
    ctx.translate(-(t.x + t.width / 2), -(t.y + t.height / 2));
  }

  private drawToastBackground(ctx: CanvasRenderingContext2D): void {
    const t = this.transform, r = this.cornerRadius;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.beginPath();
    ctx.moveTo(t.x + r, t.y); ctx.lineTo(t.x + t.width - r, t.y);
    ctx.arcTo(t.x + t.width, t.y, t.x + t.width, t.y + t.height, r);
    ctx.lineTo(t.x + t.width, t.y + t.height - r);
    ctx.arcTo(t.x + t.width, t.y + t.height, t.x + t.width - r, t.y + t.height, r);
    ctx.lineTo(t.x + r, t.y + t.height);
    ctx.arcTo(t.x, t.y + t.height, t.x, t.y + t.height - r, r);
    ctx.lineTo(t.x, t.y + r);
    ctx.arcTo(t.x, t.y, t.x + r, t.y, r);
    ctx.closePath(); ctx.fill();
  }

  private drawToastText(ctx: CanvasRenderingContext2D): void {
    const t = this.transform;
    let currentX = t.x + this.padding;
    this.parsedTextSegments.forEach((seg) => {
      ctx.fillStyle = seg.isEm ? this.emColor : "white";
      ctx.font = "16px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(seg.text, currentX, t.y + t.height / 2);
      currentX += this.ctx.measureText(seg.text).width;
    });
  }
}
