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

  public render(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.isDebugging()) {
      this.renderDebugGizmos(context);
    }

    super.render(context);
  }

  private renderDebugGizmos(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.areGizmosVisible() === false) {
      return;
    }

    context.save();

    // Draw center point
    context.fillStyle = "yellow";
    context.beginPath();
    context.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    context.fill();

    // Draw direction line (facing)
    const lineLength = 30;
    const endX = this.x + Math.cos(this.angle) * lineLength;
    const endY = this.y + Math.sin(this.angle) * lineLength;

    context.strokeStyle = "orange";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();

    context.restore();
  }
}
