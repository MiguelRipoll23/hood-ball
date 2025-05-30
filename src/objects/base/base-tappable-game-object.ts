import { GamePointer } from "../../models/game-pointer.js";
import { BaseAnimatedGameObject } from "./base-animated-object.js";

export class BaseTappableGameObject extends BaseAnimatedGameObject {
  protected width = 0;
  protected height = 0;

  protected active = true;

  protected hovering = false;
  protected pressed = false;

  constructor(protected stealFocus = false) {
    super();
  }

  public setActive(active: boolean): void {
    if (active) {
      console.log(this.constructor.name + " activated");
    } else {
      console.log(this.constructor.name + " deactivated");
    }

    this.active = active;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isHovering(): boolean {
    return this.hovering;
  }

  public isPressed(): boolean {
    return this.pressed;
  }

  public handlePointerEvent(gamePointer: GamePointer): void {
    if (this.stealFocus || this.isPointerWithinBounds(gamePointer)) {
      const pressing = gamePointer.isPressing();
      const mouse = gamePointer.getType() === "mouse";

      if (pressing || mouse) {
        this.hovering = true;
      }

      if (gamePointer.isPressed()) {
        console.log(this.constructor.name + " pressed");
        this.pressed = true;
      }
    }
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.hovering = false;
    this.pressed = false;
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (
      this.debugSettings?.isDebugging() &&
      this.debugSettings.areTappableAreasVisible() &&
      this.active
    ) {
      context.save();

      if (this.stealFocus) {
        this.drawFullScreenRectangle(context);
      } else {
        this.drawRotatedRectangle(context);
      }

      context.restore();
    }
  }

  private isPointerWithinBounds(gamePointer: GamePointer): boolean {
    const pointerX = gamePointer.getX();
    const pointerY = gamePointer.getY();

    return (
      pointerX >= this.x &&
      pointerX <= this.x + this.width &&
      pointerY >= this.y &&
      pointerY <= this.y + this.height
    );
  }

  private drawFullScreenRectangle(context: CanvasRenderingContext2D): void {
    context.lineWidth = 6; // Set the border width
    context.strokeStyle = "rgba(148, 0, 211, 0.8)";
    context.beginPath();
    context.rect(0, 0, context.canvas.width, context.canvas.height);
    context.stroke();
    context.closePath();
  }

  private drawRotatedRectangle(context: CanvasRenderingContext2D): void {
    context.translate(this.x + this.width / 2, this.y + this.height / 2);
    context.rotate(this.angle);
    context.strokeStyle = "rgba(148, 0, 211, 0.8)";
    context.beginPath();
    context.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    context.stroke();
    context.closePath();
  }
}
