import { TimerService } from "../services/gameplay/timer-service.js";
import { BaseGameEntity } from "./base-game-entity.js";
import { AnimationComponent } from "../components/animation-component.js";
import { ScriptComponent } from "../components/script-component.js";

export class DebugEntity extends BaseGameEntity {
  private text = "Unknown";
  private timer: TimerService | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.opacity = 0;

    this.addComponent(new ScriptComponent({
      update: (dt) => { this.timer?.update(dt); },
      render: (ctx) => {
        ctx.save();
        if (ctx.globalAlpha > this.opacity) ctx.globalAlpha = this.opacity;
        ctx.fillStyle = "#FFFF00";
        ctx.font = "18px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);
        ctx.restore();
      },
    }));
  }

  public show(text: string, duration = 0): void {
    this.text = text; this.opacity = 0;
    this.getComponent(AnimationComponent)!.fadeIn(0.2);
    if (duration > 0) this.timer = new TimerService(duration, () => this.hide());
  }

  public hide(): void {
    this.getComponent(AnimationComponent)!.fadeOut(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(0, 0.2);
  }
}
