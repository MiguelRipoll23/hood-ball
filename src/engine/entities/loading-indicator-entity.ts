import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";

const LIGHT_GREEN_COLOR = "#90EE90";

export class LoadingIndicatorEntity extends BaseGameEntity {
  private readonly SIZE = 20;
  private readonly MARGIN = 20;
  private readonly SPEED = 0.005;

  private visible = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new TransformComponent());
    this.getComponent(TransformComponent)!.angle = 0;
  }

  public show(): void {
    this.visible = true;
  }

  public hide(): void {
    this.visible = false;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.getComponent(TransformComponent)!.x = this.MARGIN;
    this.getComponent(TransformComponent)!.y = this.canvas.height - this.SIZE - this.MARGIN;

    if (this.visible) {
      this.getComponent(TransformComponent)!.angle += deltaTimeStamp * this.SPEED;
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (!this.visible) {
      return;
    }

    context.save();
    context.translate(this.getComponent(TransformComponent)!.x + this.SIZE / 2, this.getComponent(TransformComponent)!.y + this.SIZE / 2);
    context.rotate(this.getComponent(TransformComponent)!.angle);
    context.translate(-(this.getComponent(TransformComponent)!.x + this.SIZE / 2), -(this.getComponent(TransformComponent)!.y + this.SIZE / 2));

    context.strokeStyle = LIGHT_GREEN_COLOR;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(
      this.getComponent(TransformComponent)!.x + this.SIZE / 2,
      this.getComponent(TransformComponent)!.y + this.SIZE / 2,
      this.SIZE / 2,
      0,
      Math.PI * 1.5
    );
    context.stroke();

    context.restore();
  }
}
