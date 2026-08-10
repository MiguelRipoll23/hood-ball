import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { HelpEntity } from "./help-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";

export class MatchMenuButtonEntity extends BaseGameEntity {
  private readonly SIZE = 32;
  private readonly OFFSET = 20;
  private readonly emoji = "🍔"; // menu emoji
  private readonly DEFAULT_OPACITY = 0.7;

  private prevButtonPressed = false;
  private menuVisible = false;

  private onToggleMenu: (() => void) | null = null;

  constructor(
    private readonly boostMeterEntity: BoostMeterEntity,
    private readonly helpEntity: HelpEntity
  ) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    this.getComponent(TransformComponent)!.width = this.SIZE;
    this.getComponent(TransformComponent)!.height = this.SIZE;
    this.opacity = this.DEFAULT_OPACITY;
    this.setPosition();
  }

  public setOnToggleMenu(callback: () => void): void {
    this.onToggleMenu = callback;
  }

  public setMenuVisible(visible: boolean): void {
    this.menuVisible = visible;
  }

  private setPosition(): void {
    // Position to the left of boost meter entity
    this.getComponent(TransformComponent)!.x = this.boostMeterEntity.getX() - this.OFFSET - this.SIZE;
    this.getComponent(TransformComponent)!.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      this.SIZE / 2;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Only toggle on a new button press (not just hover/held)
    if (this.getComponent(InputComponent)!.pressed && !this.prevButtonPressed) {
      if (this.onToggleMenu) {
        this.onToggleMenu();
      }
    }

    this.prevButtonPressed = this.getComponent(InputComponent)!.pressed;
    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.menuVisible || this.helpEntity.getOpacity() > 0) {
      return;
    }

    context.save();
    this.applyOpacity(context);
    context.font = `${this.SIZE}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      this.emoji,
      this.getComponent(TransformComponent)!.x + this.SIZE / 2,
      this.getComponent(TransformComponent)!.y + this.SIZE / 2 + 1
    );
    context.restore();
    super.render(context);
  }
}
