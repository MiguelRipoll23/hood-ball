import { BaseStaticCollidingGameObject } from "./base-static-colliding-game-object.js";

export class BaseDynamicCollidingGameObject extends BaseStaticCollidingGameObject {
  protected vx: number = 0;
  protected vy: number = 0;
  protected mass: number = 0;

  constructor() {
    super();
  }

  public getVX(): number {
    return this.vx;
  }

  public setVX(vx: number): void {
    this.vx = vx;
  }

  public getVY(): number {
    return this.vy;
  }

  public setVY(vy: number): void {
    this.vy = vy;
  }

  public getMass(): number {
    return this.mass;
  }
}
