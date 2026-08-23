import type { ScriptLifecycle } from "../components/script-component.js";
import type { AnimationComponent } from "../components/animation-component.js";
import { TimerService } from "../services/gameplay/timer-service.js";

export class DebugScript implements ScriptLifecycle {
  text = "Unknown";
  private animation!: AnimationComponent;
  private timer: TimerService | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

  resolveAnimation(animation: AnimationComponent): void { this.animation = animation; }

  show(text: string, duration = 0): void {
    this.text = text;
    this.animation.fadeIn(0.2);
    if (duration > 0) this.timer = new TimerService(duration, () => this.hide());
  }

  hide(): void {
    this.animation.fadeOut(0.2);
    this.animation.scaleTo(0, 0.2);
  }

  update(dt: DOMHighResTimeStamp): void { this.timer?.update(dt); }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "#FFFF00";
    context.font = "18px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);
    context.restore();
  }
}
