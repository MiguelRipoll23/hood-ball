import type { GamePointerContract } from "../interfaces/input/game-pointer-interface.js";
import { BaseMoveableGameEntity } from "./base-moveable-game-entity.js";
import { InteractionComponent } from "../components/interaction-component.js";
import { EngineLogger } from "../services/engine-logger.js";

export class BaseTappableGameEntity extends BaseMoveableGameEntity {
  protected width = 0;
  protected height = 0;

  protected active = true;

  protected hovering = false;
  protected pressed = false;

  /** Backing InteractionComponent – use getComponent(InteractionComponent) for new code. */
  protected readonly interaction: InteractionComponent;

  constructor(protected stealFocus = false) {
    super();
    this.interaction = this.addComponent(new InteractionComponent());
    this.interaction.stealFocus = stealFocus;
  }

  public setActive(active: boolean): void {
    if (active) {
      EngineLogger.info("Tappable", this.constructor.name + " activated");
    } else {
      EngineLogger.info("Tappable", this.constructor.name + " deactivated");
    }

    this.active = active;
    this.interaction.active = active;
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

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    const touches = gamePointer.getTouchPoints();

    for (const touch of touches) {
      if (this.stealFocus || this.isPointerWithinBounds(touch.x, touch.y)) {
        const pressing = touch.pressing;
        const mouse = touch.type === "mouse";

        if (pressing || mouse) {
          this.hovering = true;
          this.interaction.hovering = true;
        }

        if (touch.pressed) {
          EngineLogger.info("Tappable", this.constructor.name + " pressed");
          this.pressed = true;
          this.interaction.pressed = true;
        }

        if (this.hovering || this.pressed) {
          break;
        }
      }
    }
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.hovering = false;
    this.pressed = false;
    this.interaction.resetFrame();
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (
      this.debugSettings?.isDebugging() &&
      this.debugSettings.areTappableAreasVisible() &&
      this.active
    ) {
      context.save();
      this.applyOpacity(context);

      if (this.stealFocus) {
        this.drawFullSceneRectangle(context);
      } else {
        this.drawRotatedRectangle(context);
      }

      context.restore();
    }
  }

  private isPointerWithinBounds(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  private drawFullSceneRectangle(context: CanvasRenderingContext2D): void {
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

  protected override applyOpacity(context: CanvasRenderingContext2D): void {
    super.applyOpacity(context);

    // Reduce opacity slightly when the entity is inactive
    if (!this.active) {
      context.globalAlpha *= 0.5;
    }
  }
}
