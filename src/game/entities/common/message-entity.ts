import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";

export class MessageEntity extends BaseGameEntity {
  private readonly FILL_COLOR = "rgba(0, 0, 0, 0.8)";
  private readonly DEFAULT_HEIGHT = 100;
  private readonly DEFAULT_WIDTH = 340;

  private textX = 0;
  private textY = 0;
  private content = "Unknown";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.addComponent(new TransformComponent());
    this.setInitialValues();
  }

  public show(value: string): void {
    this.content = value;

    if (this.opacity === 0) {
      this.getComponent(AnimationComponent)!.fadeIn(0.2);
    }
  }

  public hide(): void {
    if (this.opacity === 0) {
      EngineLogger.warn("MessageEntity", "MessageEntity is already hidden");
      return;
    }

    this.getComponent(AnimationComponent)!.fadeOut(0.2);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.applyOpacity(context);
    this.drawRoundedRectangle(context);
    this.drawText(context);
    this.applyOpacity(context);
  }

  private drawRoundedRectangle(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.FILL_COLOR;
    context.beginPath();
    context.moveTo(this.getComponent(TransformComponent)!.x + 6, this.getComponent(TransformComponent)!.y);
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      6
    );
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      6
    );
    context.arcTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height, this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, 6);
    context.arcTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.y, 6);
    context.closePath();
    context.fill();
  }

  private drawText(context: CanvasRenderingContext2D): void {
    context.font = "16px Arial";
    context.fillStyle = "WHITE";
    context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);
  }

  private setInitialValues(): void {
    this.getComponent(TransformComponent)!.width = this.DEFAULT_WIDTH;
    this.getComponent(TransformComponent)!.height = this.DEFAULT_HEIGHT;
    this.opacity = 0;
    this.setPosition();
  }

  private setPosition(): void {
    this.getComponent(TransformComponent)!.x = this.canvas.width / 2 - this.getComponent(TransformComponent)!.width / 2;
    this.getComponent(TransformComponent)!.y = this.canvas.height / 2 - this.getComponent(TransformComponent)!.height / 2;
    this.textX = this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2;
    this.textY = this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2 + 5;
  }
}
