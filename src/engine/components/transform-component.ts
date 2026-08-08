import type { Component } from "./component.js";

/**
 * Holds an entity's spatial transform: position, size, rotation, and scale.
 * Replaces the state previously spread across BaseMoveableGameEntity and
 * BaseAnimatedGameEntity.
 */
export class TransformComponent implements Component {
  public readonly componentType = "TransformComponent";
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;
  public angle = 0;
  public scale = 1;
  public skipInterpolation = false;

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public teleport(x: number, y: number, angle?: number): void {
    this.x = x;
    this.y = y;
    if (angle !== undefined) {
      this.angle = angle;
    }
    this.skipInterpolation = true;
  }
}
