import { BaseMultiplayerGameEntity } from "./base-multiplayer-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { AnimationType } from "../enums/animation-type.js";
import { EntityAnimationService } from "../services/gameplay/entity-animation-service.js";

export class BaseMoveableGameEntity extends BaseMultiplayerGameEntity {
  protected x: number = 0;
  protected y: number = 0;
  protected width: number = 0;
  protected height: number = 0;
  protected angle: number = 0;
  protected skipInterpolation = false;
  protected scale: number = 1;

  protected animationTasks: EntityAnimationService[] = [];

  /** Backing TransformComponent – use getComponent(TransformComponent) for new code. */
  protected readonly transform: TransformComponent;

  constructor() {
    super();
    this.transform = this.addComponent(new TransformComponent());
  }

  // ── Transform ──────────────────────────────────────────────────

  public getX(): number {
    return this.x;
  }

  public setX(x: number): void {
    this.x = x;
    this.transform.x = x;
  }

  public getY(): number {
    return this.y;
  }

  public setY(y: number): void {
    this.y = y;
    this.transform.y = y;
  }

  public getWidth(): number {
    return this.width;
  }

  public setWidth(width: number): void {
    this.width = width;
    this.transform.width = width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setHeight(height: number): void {
    this.height = height;
    this.transform.height = height;
  }

  public getAngle(): number {
    return this.angle;
  }

  public setAngle(angle: number): void {
    this.angle = angle;
    this.transform.angle = angle;
  }

  public setSkipInterpolation(): void {
    this.skipInterpolation = true;
    this.transform.skipInterpolation = true;
  }

  public teleport(x: number, y: number, angle?: number): void {
    this.transform.teleport(x, y, angle);
    this.x = x;
    this.y = y;
    if (angle !== undefined) {
      this.angle = angle;
    }
    this.skipInterpolation = this.transform.skipInterpolation;
  }

  // ── Scale ──────────────────────────────────────────────────────

  public getScale(): number {
    return this.scale;
  }

  public setScale(scale: number): void {
    this.scale = scale;
    this.transform.scale = scale;
  }

  // ── Animations ─────────────────────────────────────────────────

  public fadeIn(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(this, AnimationType.FadeIn, 0, 1, seconds)
    );
  }

  public fadeOut(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(this, AnimationType.FadeOut, 1, 0, seconds)
    );
  }

  public moveToX(newX: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveX,
        this.x,
        newX,
        seconds
      )
    );
  }

  public moveToY(newY: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveY,
        this.y,
        newY,
        seconds
      )
    );
  }

  public rotateTo(newAngle: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Rotate,
        this.angle,
        newAngle,
        seconds
      )
    );
  }

  public scaleTo(newScale: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Scale,
        this.scale,
        newScale,
        seconds
      )
    );
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  public reset(): void {
    this.animationTasks.length = 0;
    super.reset();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.animationTasks.forEach((animation) => {
      animation.update(deltaTimeStamp);

      // Remove completed animations
      if (animation.isCompleted()) {
        const index = this.animationTasks.indexOf(animation);
        this.animationTasks.splice(index, 1);
      }
    });

    super.update(deltaTimeStamp);
  }
}
