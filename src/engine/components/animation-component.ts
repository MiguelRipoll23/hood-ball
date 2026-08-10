import type { Component } from "./component.js";
import { AnimationType } from "../enums/animation-type.js";
import { EntityAnimationService } from "../services/gameplay/entity-animation-service.js";
import type { BaseGameEntity } from "../entities/base-game-entity.js";
import { TransformComponent } from "./transform-component.js";

/**
 * Manages animation tasks (fade, move, rotate, scale) that were previously
 * part of BaseGameEntity.
 *
 * When attached to an entity, call animate*() methods to queue animations
 * that will be processed each frame during update().
 *
 * Semantics: **last animation wins.** Starting a new animation cancels any
 * pending task that drives the same property (opacity for fades, scale, angle,
 * x, y) and resets that property to its canonical starting value so the new
 * animation always begins from a fresh state instead of fighting a stale one.
 */
export class AnimationComponent implements Component {
  static readonly componentType = "AnimationComponent";
  public readonly componentType = AnimationComponent.componentType;

  /** Reference to the owning entity. Set automatically by addComponent(). */
  public entity?: BaseGameEntity;

  private animationTasks: EntityAnimationService[] = [];

  public fadeIn(seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.FadeIn, AnimationType.FadeOut);
    entity.setOpacity(0);
    this.animationTasks.push(
      new EntityAnimationService(entity, AnimationType.FadeIn, 0, 1, seconds),
    );
  }

  public fadeOut(seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.FadeIn, AnimationType.FadeOut);
    entity.setOpacity(1);
    this.animationTasks.push(
      new EntityAnimationService(entity, AnimationType.FadeOut, 1, 0, seconds),
    );
  }

  public moveToX(newX: number, seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.MoveX);
    const transform = entity.getComponent(
      TransformComponent as unknown as new (...args: never[]) => TransformComponent,
    );
    const startX = transform?.x ?? 0;
    this.animationTasks.push(
      new EntityAnimationService(entity, AnimationType.MoveX, startX, newX, seconds),
    );
  }

  public moveToY(newY: number, seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.MoveY);
    const transform = entity.getComponent(
      TransformComponent as unknown as new (...args: never[]) => TransformComponent,
    );
    const startY = transform?.y ?? 0;
    this.animationTasks.push(
      new EntityAnimationService(entity, AnimationType.MoveY, startY, newY, seconds),
    );
  }

  public rotateTo(newAngle: number, seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.Rotate);
    const transform = entity.getComponent(
      TransformComponent as unknown as new (...args: never[]) => TransformComponent,
    );
    const startAngle = transform?.angle ?? 0;
    this.animationTasks.push(
      new EntityAnimationService(
        entity,
        AnimationType.Rotate,
        startAngle,
        newAngle,
        seconds,
      ),
    );
  }

  public scaleTo(newScale: number, seconds: number): void {
    const entity = this.entity;
    if (!entity) return;
    this.removeTasksOfType(AnimationType.Scale);
    const transform = entity.getComponent(
      TransformComponent as unknown as new (...args: never[]) => TransformComponent,
    );
    const startScale = transform?.scale ?? 1;
    this.animationTasks.push(
      new EntityAnimationService(
        entity,
        AnimationType.Scale,
        startScale,
        newScale,
        seconds,
      ),
    );
  }

  public clearAnimations(): void {
    this.animationTasks.length = 0;
  }

  /** True while at least one animation task is still running. */
  public hasActiveAnimations(): boolean {
    return this.animationTasks.length > 0;
  }

  /** Cancel any pending tasks that drive the same property as the new animation. */
  private removeTasksOfType(...types: AnimationType[]): void {
    this.animationTasks = this.animationTasks.filter(
      (task) => !types.includes(task.getAnimationType()),
    );
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    for (let i = this.animationTasks.length - 1; i >= 0; i--) {
      const animation = this.animationTasks[i];
      animation.update(deltaTimeStamp);

      if (animation.isCompleted()) {
        this.animationTasks.splice(i, 1);
      }
    }
  }
}
