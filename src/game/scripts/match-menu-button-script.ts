import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import type { BoostMeterEntity } from "../entities/boost-meter-entity.js";
import type { HelpEntity } from "../entities/help-entity.js";

const SIZE = 32;
const OFFSET = 20;

/**
 * Script behaviour for the burger-menu toggle button. Detects presses
 * and fires a callback; renders the burger emoji when menu is hidden.
 * Attached to MatchMenuButtonEntity via ScriptComponent.
 */
export class MatchMenuButtonScript implements ScriptLifecycle {
  menuVisible = false;
  private prevButtonPressed = false;

  private onToggleMenu: (() => void) | null = null;
  private transform!: TransformComponent;
  private input!: InputComponent;

  private readonly boostMeterEntity: BoostMeterEntity;
  private readonly helpEntity: HelpEntity;
  private readonly opacity = 0.7;

  constructor(
    boostMeterEntity: BoostMeterEntity,
    helpEntity: HelpEntity,
  ) {
    this.boostMeterEntity = boostMeterEntity;
    this.helpEntity = helpEntity;
  }

  resolveComponents(transform: TransformComponent, input: InputComponent): void {
    this.transform = transform;
    this.input = input;
  }

  init(): void {
    this.transform.width = SIZE;
    this.transform.height = SIZE;
    this.transform.x =
      this.boostMeterEntity.getX() - OFFSET - SIZE;
    this.transform.y =
      this.boostMeterEntity.getY() +
      this.boostMeterEntity.getHeight() / 2 -
      SIZE / 2;
  }

  setOnToggleMenu(cb: () => void): void {
    this.onToggleMenu = cb;
  }

  update(): void {
    if (this.input.pressed && !this.prevButtonPressed && this.onToggleMenu) {
      this.onToggleMenu();
    }
    this.prevButtonPressed = this.input.pressed;
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.menuVisible || this.helpEntity.getOpacity() > 0) return;

    context.save();
    if (context.globalAlpha > this.opacity) {
      context.globalAlpha = this.opacity;
    }
    context.font = `${SIZE}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "\uD83C\uDF54",
      this.transform.x + SIZE / 2,
      this.transform.y + SIZE / 2 + 1,
    );
    context.restore();
  }
}
