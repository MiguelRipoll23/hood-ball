import { TimerService } from "../services/gameplay/timer-service.js";
import { BaseGameEntity } from "./base-game-entity.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";

export class DebugEntity extends BaseGameEntity {
  private text: string = "Unknown";
  private timer: TimerService | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.reset();
  }

  public show(text: string, duration = 0): void {
    this.text = text;
    this.reset();
    this.getComponent(AnimationComponent)!.fadeIn(0.2);

    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
    }
  }

  public hide(): void {
    this.getComponent(AnimationComponent)!.fadeOut(0.2);
    this.getComponent(AnimationComponent)!.scaleTo(0, 0.2);
  }

  public override reset(): void {
    this.opacity = 0;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.timer?.update(deltaTimeStamp);
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);
    this.drawText(context);

    context.restore();
  }

  private drawText(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#FFFF00";
    context.font = "18px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);
  }
}
