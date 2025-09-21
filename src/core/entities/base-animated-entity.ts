import { AnimationType } from "@engine/enums/animation-type.js";
import { EntityAnimationService } from "@engine/services/animation/entity-animation-service.js";
import { BaseMoveableGameEntity } from "./base-moveable-game-entity.js";
import { AnimationLogService } from "@engine/services/debug/animation-log-service.js";
import { container } from "../services/di-container.js";

export class BaseAnimatedGameEntity extends BaseMoveableGameEntity {
  private readonly animationLogService = container.get(AnimationLogService);
  protected scale: number = 1;

  protected animationTasks: EntityAnimationService[] = [];

  constructor() {
    super();
  }

  public getScale(): number {
    return this.scale;
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  public fadeIn(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.FadeIn,
        0,
        1,
        seconds,
        this.animationLogService
      )
    );
  }

  public fadeOut(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.FadeOut,
        1,
        0,
        seconds,
        this.animationLogService
      )
    );
  }

  public moveToX(newX: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveX,
        this.x,
        newX,
        seconds,
        this.animationLogService
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
        seconds,
        this.animationLogService
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
        seconds,
        this.animationLogService
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
        seconds,
        this.animationLogService
      )
    );
  }

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
