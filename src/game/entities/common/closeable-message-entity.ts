import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";

export class CloseableMessageEntity extends BaseGameEntity {
  private readonly FILL_COLOR = "rgba(0, 0, 0, 0.8)";

  private readonly DEFAULT_HEIGHT = 100;
  private readonly DEFAULT_WIDTH = 340;

  private textX = 0;
  private textY = 0;

  private content = "Whoops! Something went wrong!";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new AnimationComponent());
    this.addComponent(new InputComponent(true)); // stealFocus: tapping anywhere (incl. backdrop) closes
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.getComponent(InputComponent)!.active = false;
    this.opacity = 0;
    this.setSize();
    this.setPosition();
  }

  public show(value: string): void {
    this.setPosition();
    this.content = value;
    this.getComponent(AnimationComponent)!.fadeIn(0.2);
    this.getComponent(InputComponent)!.active = true;
  }

  public isActive(): boolean { return this.getComponent(InputComponent)!.active; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public handlePointerEvent(gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }

  public close(): void {
    if (this.opacity === 0) {
      EngineLogger.warn("CloseableMessageEntity", "CloseableMessageEntity is already closed");
      return;
    }

    this.getComponent(InputComponent)!.active = false;
    this.getComponent(AnimationComponent)!.fadeOut(0.2);
  }

  private scriptUpdate(_deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.getComponent(InputComponent)!.pressed) {
      this.close();
    }

  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);
    this.drawRoundedRectangle(context);
    this.drawText(context);
    context.restore();

  }

  private setSize(): void {
    this.getComponent(TransformComponent)!.width = this.DEFAULT_WIDTH;
    this.getComponent(TransformComponent)!.height = this.DEFAULT_HEIGHT;
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

  private setPosition(): void {
    this.getComponent(TransformComponent)!.x = this.canvas.width / 2 - this.getComponent(TransformComponent)!.width / 2;
    this.getComponent(TransformComponent)!.y = this.canvas.height / 2 - this.getComponent(TransformComponent)!.height / 2;
    this.textX = this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2;
    this.textY = this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2 + 5;
  }
}
