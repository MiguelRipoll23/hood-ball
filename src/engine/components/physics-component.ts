import type { Component } from "./component.js";

/**
 * Holds physics state for dynamic entities: velocity, mass, and collision
 * response properties. Previously part of BaseDynamicCollidingGameEntity.
 */
export class PhysicsComponent implements Component {
  public readonly componentType = "PhysicsComponent";
  public vx = 0;
  public vy = 0;
  public mass = 0;
  public bounciness = 1;
  public rigidBody = true;
  public isDynamic = false;

  public resetVelocity(): void {
    this.vx = 0;
    this.vy = 0;
  }
}
