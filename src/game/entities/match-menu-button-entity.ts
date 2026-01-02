import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { HelpEntity } from "./help-entity.js";

export class MatchMenuButtonEntity extends BaseTappableGameEntity {
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
    this.width = this.SIZE;
    this.height = this.SIZE;
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
    this.x = this.boostMeterEntity.getX() - this.OFFSET - this.SIZE;
    this.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      this.SIZE / 2 - 3;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Only toggle on a new button press (not just hover/held)
    if (this.pressed && !this.prevButtonPressed) {
      if (this.onToggleMenu) {
        this.onToggleMenu();
      }
    }

    this.prevButtonPressed = this.pressed;
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
      this.x + this.SIZE / 2,
      this.y + this.SIZE / 2 + 1
    );
    context.restore();
    super.render(context);
  }
}
