import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";

export class NotificationEntity extends BaseGameEntity {
  private readonly HEIGHT = 35;
  private readonly Y_MARGIN = 20;
  private readonly TEXT_SPEED = 2;

  private context: CanvasRenderingContext2D;
  private _nactive: boolean = false;
  private textX = 0;
  private completedTimes = 0;
  private _ny: number = 0;
  private text = "Whoops! Something went wrong!";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.addComponent(new TransformComponent());
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this._ny = this.Y_MARGIN;
    this.textX = this.canvas.width;
    this.opacity = 0;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this._nactive) {
      this.updateTextPosition();
    }

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    this.applyOpacity(context);

    // Draw red borders
    context.fillStyle = "rgba(255, 0, 0, 0.85)";
    context.fillRect(this.getComponent(TransformComponent)!.x, this._ny, this.canvas.width, 1); // Top border
    context.fillRect(this.getComponent(TransformComponent)!.x, this._ny + this.HEIGHT - 1, this.canvas.width, 1); // Bottom border

    // Draw black rectangle
    context.fillStyle = "rgba(0, 0, 0, 0.85)";
    context.fillRect(this.getComponent(TransformComponent)!.x, this._ny + 1, this.canvas.width, this.HEIGHT - 2); // Main rectangle

    // Draw text
    context.fillStyle = "#FFF";
    context.font = "20px system-ui";
    context.fillText(this.text, this.textX, this._ny + this.HEIGHT / 2 + 6);

    context.restore();
  }

  public show(text: string): void {
    this.reset();
    this.text = text;
    this.getComponent(AnimationComponent)!.moveToY(this.Y_MARGIN, 0.2);
    this.getComponent(AnimationComponent)!.fadeIn(0.4);
  }

  public override reset(): void {
    super.reset();

    this._ny = 0;
    this.completedTimes = 0;
    this.textX = this.canvas.width + this.context.measureText(this.text).width;
    this._nactive = true;
  }

  private updateTextPosition(): void {
    if (this.animationTasks.length > 0) {
      return;
    }

    this.textX -= this.TEXT_SPEED;

    // Reset position if text is out of scene
    const textWidth = this.context.measureText(this.text).width;

    if (this.textX < -textWidth) {
      this.completedTimes++;
      this.textX = this.canvas.width + textWidth;

      if (this.completedTimes === 2) {
        this.close();
      }
    }
  }

  private close(): void {
    this.getComponent(AnimationComponent)!.moveToY(-this.HEIGHT, 0.2);
    this.getComponent(AnimationComponent)!.fadeOut(0.4);
    this._nactive = false;
  }
}
