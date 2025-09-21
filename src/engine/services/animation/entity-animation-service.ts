import { AnimationType } from "@engine/enums/animation-type.js";
import type { AnimatableEntity } from "@engine/interfaces/entities/animatable-entity.js";
import type { AnimationLogService } from "@engine/services/debug/animation-log-service.js";

export class EntityAnimationService {
  private readonly entity: AnimatableEntity;
  private readonly durationMilliseconds: number;
  private readonly animationType: AnimationType;
  private readonly animationLogService: AnimationLogService | null;
  private readonly startValue: number;
  private readonly endValue: number;

  private elapsedMilliseconds = 0;
  private completed = false;

  constructor(
    entity: AnimatableEntity,
    animationType: AnimationType,
    startValue: number,
    endValue: number,
    durationSeconds: number,
    animationLogService?: AnimationLogService
  ) {
    this.entity = entity;
    this.animationType = animationType;
    this.startValue = startValue;
    this.endValue = endValue;
    this.durationMilliseconds = durationSeconds * 1000;
    this.animationLogService = animationLogService ?? null;

    this.animationLogService?.register(
      this,
      entity,
      AnimationType[animationType] ?? "Unknown"
    );
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.elapsedMilliseconds += deltaTimeStamp;

    const progress = Math.min(
      this.elapsedMilliseconds / this.durationMilliseconds,
      1
    );
    const newValue =
      this.startValue + (this.endValue - this.startValue) * progress;

    switch (this.animationType) {
      case AnimationType.FadeIn:
      case AnimationType.FadeOut:
        this.entity.setOpacity(newValue);
        break;
      case AnimationType.MoveX:
        this.entity.setX(newValue);
        break;
      case AnimationType.MoveY:
        this.entity.setY(newValue);
        break;
      case AnimationType.Rotate:
        this.entity.setAngle(newValue);
        break;
      case AnimationType.Scale:
        this.entity.setScale(newValue);
        break;
    }

    this.completed = progress >= 1;
    this.animationLogService?.update(this, progress, this.completed);
  }

  public getProgress(): number {
    return Math.min(this.elapsedMilliseconds / this.durationMilliseconds, 1);
  }

  public isCompleted(): boolean {
    return this.completed;
  }
}
