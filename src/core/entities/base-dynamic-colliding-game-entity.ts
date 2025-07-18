import { BaseStaticCollidingGameEntity } from "./base-static-colliding-game-entity.js";

export class BaseDynamicCollidingGameEntity extends BaseStaticCollidingGameEntity {
  private static readonly LINE_LENGTH = 50;
  private static readonly ARROW_SIZE = 15;
  private static readonly CENTER_CIRCLE_RADIUS = 7;
  private static readonly CENTER_FILL_STYLE = "rgba(255, 255, 0, 0.6)";
  private static readonly CENTER_STROKE_STYLE = "yellow";
  private static readonly DIRECTION_STROKE_STYLE = "orange";
  private static readonly ARROW_ANGLE_OFFSET = Math.PI / 7;
  private static readonly LINE_WIDTH = 3;
  private static readonly CENTER_LINE_WIDTH = 2;

  protected vx: number = 0;
  protected vy: number = 0;
  protected mass: number = 0;
  protected bounciness: number = 1;

  public override isDynamic(): boolean {
    return true;
  }

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

  public getBounciness(): number {
    return this.bounciness;
  }

  public setBounciness(bounciness: number): void {
    this.bounciness = bounciness;
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

    // Center circle with subtle fill
    context.fillStyle = BaseDynamicCollidingGameEntity.CENTER_FILL_STYLE;
    context.strokeStyle = BaseDynamicCollidingGameEntity.CENTER_STROKE_STYLE;
    context.lineWidth = BaseDynamicCollidingGameEntity.CENTER_LINE_WIDTH;
    context.beginPath();
    context.arc(
      this.x,
      this.y,
      BaseDynamicCollidingGameEntity.CENTER_CIRCLE_RADIUS,
      0,
      2 * Math.PI
    );
    context.fill();
    context.stroke();

    // Draw direction line with arrowhead
    const lineLength = BaseDynamicCollidingGameEntity.LINE_LENGTH;
    const angleRad = this.angle;

    const endX = this.x + Math.cos(angleRad) * lineLength;
    const endY = this.y + Math.sin(angleRad) * lineLength;

    context.strokeStyle = BaseDynamicCollidingGameEntity.DIRECTION_STROKE_STYLE;
    context.lineWidth = BaseDynamicCollidingGameEntity.LINE_WIDTH;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();

    // Draw arrowhead
    const arrowSize = BaseDynamicCollidingGameEntity.ARROW_SIZE;
    context.fillStyle = BaseDynamicCollidingGameEntity.DIRECTION_STROKE_STYLE;
    context.beginPath();

    const arrowAngle1 =
      angleRad + BaseDynamicCollidingGameEntity.ARROW_ANGLE_OFFSET;
    const arrowAngle2 =
      angleRad - BaseDynamicCollidingGameEntity.ARROW_ANGLE_OFFSET;

    context.moveTo(endX, endY);
    context.lineTo(
      endX - arrowSize * Math.cos(arrowAngle1),
      endY - arrowSize * Math.sin(arrowAngle1)
    );
    context.lineTo(
      endX - arrowSize * Math.cos(arrowAngle2),
      endY - arrowSize * Math.sin(arrowAngle2)
    );
    context.closePath();
    context.fill();

    context.restore();
  }
}
