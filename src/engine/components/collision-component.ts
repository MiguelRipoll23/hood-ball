import type { Component } from "./component.js";
import type { HitboxEntity } from "../entities/hitbox-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { PhysicsComponent } from "./physics-component.js";

type CollidingEntity = {
  getComponent<T extends Component>(ctor: new (...args: never[]) => T): T | null;
};

type CollisionExclusionCtor = new (...args: never[]) => CollidingEntity;

/**
 * Manages collision state: hitbox references, colliding-entity tracking,
 * and class-based collision exclusions. Previously part of
 * BaseStaticCollidingGameEntity.
 *
 * Also renders hitbox debug overlays (purple rectangles) when debug
 * mode is enabled and hitbox visibility is on.
 */
export class CollisionComponent implements Component {
  static readonly componentType = "CollisionComponent";
  public readonly componentType = CollisionComponent.componentType;
  public hitboxEntities: HitboxEntity[] = [];
  public collidingEntities: CollidingEntity[] = [];
  public avoidingCollision = false;

  /** Populated by BaseGameEntity.setDebugSettings() when debug toggles change. */
  public debugSettings: DebugSettings | null = null;

  private excludedCollisionClasses: CollisionExclusionCtor[] = [];

  // ── Hitbox debug rendering constants ───────────────────────────

  private static readonly HITBOX_STROKE_STYLE = "rgba(148, 0, 211, 0.2)";
  private static readonly HITBOX_COLLIDING_FILL_STYLE = "rgba(148, 0, 211, 0.5)";

  public isColliding(): boolean {
    return this.collidingEntities.some(
      (entity) => {
        const phys = entity.getComponent(PhysicsComponent);
        return this.isCollisionClassIncluded(entity.constructor as CollisionExclusionCtor) &&
          (phys?.rigidBody ?? false);
      },
    );
  }

  public isCollidingWithStatic(): boolean {
    return this.collidingEntities.some(
      (entity) => {
        const phys = entity.getComponent(PhysicsComponent);
        return this.isCollisionClassIncluded(entity.constructor as CollisionExclusionCtor) &&
          !(phys?.isDynamic ?? false) &&
          (phys?.rigidBody ?? false);
      },
    );
  }

  public addCollisionExclusion(classType: CollisionExclusionCtor): void {
    if (!this.excludedCollisionClasses.includes(classType)) {
      this.excludedCollisionClasses.push(classType);
    }
  }

  public removeCollisionExclusion(classType: CollisionExclusionCtor): void {
    this.excludedCollisionClasses = this.excludedCollisionClasses.filter(
      (type) => type !== classType,
    );
  }

  public render(context: CanvasRenderingContext2D): void {
    if (
      !this.debugSettings?.isDebugging() ||
      !this.debugSettings?.areHitboxesVisible()
    ) return;

    for (const hitbox of this.hitboxEntities) {
      context.save();

      context.strokeStyle = CollisionComponent.HITBOX_STROKE_STYLE;
      context.strokeRect(
        hitbox.getX(),
        hitbox.getY(),
        hitbox.getWidth(),
        hitbox.getHeight(),
      );

      if (hitbox.isColliding()) {
        context.fillStyle = CollisionComponent.HITBOX_COLLIDING_FILL_STYLE;
        context.fillRect(
          hitbox.getX(),
          hitbox.getY(),
          hitbox.getWidth(),
          hitbox.getHeight(),
        );
      }

      context.restore();
    }
  }

  private isCollisionClassIncluded(classType: CollisionExclusionCtor): boolean {
    return !this.excludedCollisionClasses.some(
      (excludedType) =>
        classType.prototype instanceof excludedType || classType === excludedType,
    );
  }
}
