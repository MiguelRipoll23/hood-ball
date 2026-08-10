import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";

export class SmallButtonEntity extends BaseGameEntity {
  private readonly FONT = "bold 15px system-ui";
  private text: string;
  private backgroundColor: string;
  private hoverColor: string;
  private textColor: string;
  private radius: number;
  private wasPressed = false;
  private disabled = false;

  constructor(
    text: string,
    width: number,
    height: number,
    backgroundColor: string = "rgba(200, 50, 50, 0.8)",
    hoverColor: string = "rgba(220, 60, 60, 0.9)",
    textColor: string = "#ffffff",
    radius: number = 20
  ) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    const _s = this; this.addComponent(new ScriptComponent({ update: (dt) => _s.scriptUpdate(dt), render: (ctx) => _s.scriptRender(ctx) }));
    this.text = text;
    this.getComponent(TransformComponent)!.width = width;
    this.getComponent(TransformComponent)!.height = height;
    this.backgroundColor = backgroundColor;
    this.hoverColor = hoverColor;
    this.textColor = textColor;
    this.radius = radius;
  }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
  }

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) {
      this.getComponent(InputComponent)!.hovering = false;
      this.getComponent(InputComponent)!.pressed = false;
    }
  }

  public isDisabled(): boolean {
    return this.disabled;
  }

  public handlePointerEvent(gamePointer: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    if (this.disabled) return;
    super.handlePointerEvent(gamePointer);
  }

  private scriptUpdate(delta: DOMHighResTimeStamp): void {
    if (this.disabled) {
      super.update(delta);
      return;
    }

    if (this.getComponent(InputComponent)!.pressed) {
      this.wasPressed = true;
    }
    super.update(delta);
  }

  public isButtonPressed(): boolean {
    const result = this.wasPressed;
    this.wasPressed = false;
    return result;
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    if (!this.getComponent(InputComponent)!.active) return;

    context.save();
    context.globalAlpha = this.opacity;

    if (this.disabled) {
      context.fillStyle = "rgba(180, 180, 180, 0.5)";
    } else {
      context.fillStyle = this.getComponent(InputComponent)!.hovering ? this.hoverColor : this.backgroundColor;
    }

    this.drawRoundedRect(context, this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.height, this.radius);
    context.fill();

    // Draw button text
    context.fillStyle = this.disabled ? "rgba(255, 255, 255, 0.5)" : this.textColor;
    context.font = this.FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      this.text,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2
    );

    context.restore();
    super.render(context);
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
  public override update(deltaTimeStamp: DOMHighResTimeStamp): void { super.update(deltaTimeStamp); }
  public override render(context: CanvasRenderingContext2D): void { super.render(context); }
}
