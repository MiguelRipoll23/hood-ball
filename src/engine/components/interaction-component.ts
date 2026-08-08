import type { Component } from "./component.js";

/**
 * Holds pointer-interaction state: active, hovering, pressed, and focus
 * stealing. Previously part of BaseTappableGameEntity.
 */
export class InteractionComponent implements Component {
  static readonly componentType = "InteractionComponent";
  public readonly componentType = InteractionComponent.componentType;
  public active = true;
  public hovering = false;
  public pressed = false;
  public stealFocus = false;

  public resetFrame(): void {
    this.hovering = false;
    this.pressed = false;
  }
}
