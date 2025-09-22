import { AnimationType } from "@engine/enums/animation-type.js";
import { EntityAnimationService } from "@engine/services/animation/entity-animation-service.js";
import type { AnimationLogService } from "@engine/services/debug/animation-log-service.js";
import { BaseMoveableGameEntity } from "./base-moveable-game-entity.js";

export class BaseAnimatedGameEntity<
  TTypeId = unknown,
  TOwner = unknown
> extends BaseMoveableGameEntity<TTypeId, TOwner> {
  private static animationLogService: AnimationLogService | null = null;

  public static configureAnimationLogService(
    service: AnimationLogService | null
  ): void {
    BaseAnimatedGameEntity.animationLogService = service;
  }

  protected static getAnimationLogService(): AnimationLogService | null {
    return BaseAnimatedGameEntity.animationLogService;
  }

  protected get animationLogService(): AnimationLogService | null {
    return BaseAnimatedGameEntity.getAnimationLogService();
  }

  protected scale = 1;
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
        this.animationLogService ?? undefined
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
        this.animationLogService ?? undefined
      )
    );
  }

  public moveToX(newX: number, seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveX,
        this.x,
        newX,
        seconds,
        this.animationLogService ?? undefined
      )
    );
  }

  public moveToY(newY: number, seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveY,
        this.y,
        newY,
        seconds,
        this.animationLogService ?? undefined
      )
    );
  }

  public rotateTo(newAngle: number, seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Rotate,
        this.angle,
        newAngle,
        seconds,
        this.animationLogService ?? undefined
      )
    );
  }

  public scaleTo(newScale: number, seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Scale,
        this.scale,
        newScale,
        seconds,
        this.animationLogService ?? undefined
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

      if (animation.isCompleted()) {
        const index = this.animationTasks.indexOf(animation);
        this.animationTasks.splice(index, 1);
      }
    });

    super.update(deltaTimeStamp);
  }
}
