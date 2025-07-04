import { BaseMoveableGameObject } from "./base-moveable-game-object.js";
import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";

export class LoadingIndicatorObject extends BaseMoveableGameObject {
  private readonly SIZE = 20;
  private readonly MARGIN = 20;
  private readonly SPEED = 0.005;

  private visible = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.angle = 0;
  }

  public show(): void {
    this.visible = true;
  }

  public hide(): void {
    this.visible = false;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.x = this.MARGIN;
    this.y = this.canvas.height - this.SIZE - this.MARGIN;

    if (this.visible) {
      this.angle += deltaTimeStamp * this.SPEED;
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (!this.visible) {
      return;
    }

    context.save();
    context.translate(this.x + this.SIZE / 2, this.y + this.SIZE / 2);
    context.rotate(this.angle);
    context.translate(-(this.x + this.SIZE / 2), -(this.y + this.SIZE / 2));

    context.strokeStyle = LIGHT_GREEN_COLOR;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(this.x + this.SIZE / 2, this.y + this.SIZE / 2, this.SIZE / 2, 0, Math.PI * 1.5);
    context.stroke();

    context.restore();
  }
}
