import { AnimationType } from "../../enums/animation-type.js";
import type { BaseGameEntity } from "../../entities/base-game-entity.js";
import { TransformComponent } from "../../components/transform-component.js";
import { animationLogService } from "./animation-log-service.js";
import { EngineLogger } from "../engine-logger.js";

export class EntityAnimationService {
  private readonly entity: BaseGameEntity;
  private readonly transform: TransformComponent | null;

  private completed: boolean = false;

  private startValue: number;
  private endValue: number;

  private durationMilliseconds: number;
  private elapsedMilliseconds: number = 0;

  private animationType: AnimationType;

  constructor(
    entity: BaseGameEntity,
    animationType: AnimationType,
    startValue: number,
    endValue: number,
    durationSeconds: number,
  ) {
    this.entity = entity;
    this.transform = entity.getComponent(TransformComponent as unknown as new (...args: never[]) => TransformComponent);
    this.startValue = startValue;
    this.endValue = endValue;
    this.durationMilliseconds = durationSeconds * 1000;
    this.animationType = animationType;

    animationLogService.register(this, entity, animationType);

    EngineLogger.info(
      "EntityAnimation",
      `${this.constructor.name} [${AnimationType[animationType]}] created for ${entity.constructor.name}`,
    );
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp) {
    this.elapsedMilliseconds += deltaTimeStamp;

    const progress = Math.min(
      this.elapsedMilliseconds / this.durationMilliseconds,
      1,
    );

    const newValue =
      this.startValue + (this.endValue - this.startValue) * progress;

    switch (this.animationType) {
      case AnimationType.FadeIn:
      case AnimationType.FadeOut:
        this.entity.setOpacity(newValue);
        break;

      case AnimationType.MoveX:
        if (this.transform) this.transform.x = newValue;
        break;

      case AnimationType.MoveY:
        if (this.transform) this.transform.y = newValue;
        break;

      case AnimationType.Rotate:
        if (this.transform) this.transform.angle = newValue;
        break;

      case AnimationType.Scale:
        if (this.transform) this.transform.scale = newValue;
        break;
    }

    this.completed = progress >= 1;

    animationLogService.update(this, progress, this.completed);
  }

  public getProgress(): number {
    return Math.min(this.elapsedMilliseconds / this.durationMilliseconds, 1);
  }

  public isCompleted(): boolean {
    return this.completed;
  }
}
