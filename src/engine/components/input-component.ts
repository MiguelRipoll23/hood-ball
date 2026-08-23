import type { Component } from "./component.js";
import type { BaseGameEntity } from "../entities/base-game-entity.js";
import type { GamePointerContract } from "../interfaces/input/game-pointer-interface.js";
import { TransformComponent } from "./transform-component.js";

/**
 * Handles pointer and touch input, determining whether a pointer event
 * falls within an entity's bounds. Extracted from BaseGameEntity.
 *
 * Entities using this component should call `handlePointerEvent(gamePointer)`
 * each frame (typically from the scene's pointer loop).
 */
export class InputComponent implements Component {
  static readonly componentType = "InputComponent";
  public readonly componentType = InputComponent.componentType;

  /** Reference to the owning entity. Set automatically by addComponent(). */
  public entity?: BaseGameEntity;

  public active = true;
  public hovering = false;
  public pressed = false;
  public stealFocus = false;

  constructor(stealFocus = false) {
    this.stealFocus = stealFocus;
  }

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    const entity = this.entity;
    if (!entity) return;

    // Reset per-frame state before processing new events. This used to
    // happen in update() but was moved here so scripts can consume the
    // previous frame's pressed/hovering state during their own update().
    this.resetFrame();

    const transform = entity.getComponent(
      TransformComponent as unknown as new (...args: never[]) => TransformComponent,
    );
    if (!transform) return;

    const touches = gamePointer.getTouchPoints();

    for (const touch of touches) {
      if (this.stealFocus || this.isPointerWithinBounds(touch.x, touch.y, transform)) {
        const pressing = touch.pressing;
        const mouse = touch.type === "mouse";

        if (pressing || mouse) {
          this.hovering = true;
        }

        if (touch.pressed) {
          this.pressed = true;
        }

        if (this.hovering || this.pressed) {
          break;
        }
      }
    }
  }

  /**
   * No longer resets per-frame state — that now happens at the start of
   * {@link handlePointerEvent} so scripts can consume the previous frame's
   * pressed/hovering state before it is cleared.
   */

  public resetFrame(): void {
    this.hovering = false;
    this.pressed = false;
  }

  private isPointerWithinBounds(
    x: number,
    y: number,
    transform: TransformComponent,
  ): boolean {
    return (
      x >= transform.x &&
      x <= transform.x + transform.width &&
      y >= transform.y &&
      y <= transform.y + transform.height
    );
  }
}
