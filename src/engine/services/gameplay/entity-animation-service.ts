import { AnimationType } from "../../enums/animation-type.js";
import type { AnimatableEntity } from "../../interfaces/entities/animatable-entity-interface.js";
import { AnimationLogService } from "./animation-log-service.js";
import { container } from "../di-container.js";

export class EntityAnimationService {
  private readonly entity: AnimatableEntity;

  private readonly animationLogService: AnimationLogService =
    container.get(AnimationLogService);

  private completed: boolean = false;

  private startValue: number;
  private endValue: number;

  private durationMilliseconds: number;
  private elapsedMilliseconds: number = 0;

  private animationType: AnimationType;

  constructor(
    entity: AnimatableEntity,
    animationType: AnimationType,
    startValue: number,
    endValue: number,
    durationSeconds: number
  ) {
    this.entity = entity;
    this.startValue = startValue;
    this.endValue = endValue;
    this.durationMilliseconds = durationSeconds * 1000;
    this.animationType = animationType;

    this.animationLogService.register(this, entity, animationType);

    console.log(
      `${this.constructor.name} [${AnimationType[animationType]}] created for ${entity.constructor.name}`
    );
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp) {
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

    this.animationLogService.update(this, progress, this.completed);
  }

  public getProgress(): number {
    return Math.min(this.elapsedMilliseconds / this.durationMilliseconds, 1);
  }

  public isCompleted(): boolean {
    return this.completed;
  }
}
