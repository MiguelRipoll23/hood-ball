import type { Component } from "./component.js";
import type { HitboxEntity } from "../entities/hitbox-entity.js";

type CollidingEntity = {
  hasRigidBody(): boolean;
  isDynamic(): boolean;
  getHitboxEntities(): HitboxEntity[];
};

type CollisionExclusionCtor = new (...args: never[]) => CollidingEntity;

/**
 * Manages collision state: hitbox references, colliding-entity tracking,
 * and class-based collision exclusions. Previously part of
 * BaseStaticCollidingGameEntity.
 */
export class CollisionComponent implements Component {
  public readonly componentType = "CollisionComponent";
  public hitboxEntities: HitboxEntity[] = [];
  public collidingEntities: CollidingEntity[] = [];
  public avoidingCollision = false;

  private excludedCollisionClasses: CollisionExclusionCtor[] = [];

  public isColliding(): boolean {
    return this.collidingEntities.some(
      (entity) =>
        this.isCollisionClassIncluded(entity.constructor as CollisionExclusionCtor) &&
        entity.hasRigidBody(),
    );
  }

  public isCollidingWithStatic(): boolean {
    return this.collidingEntities.some(
      (entity) =>
        this.isCollisionClassIncluded(entity.constructor as CollisionExclusionCtor) &&
        !entity.isDynamic() &&
        entity.hasRigidBody(),
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

  private isCollisionClassIncluded(classType: CollisionExclusionCtor): boolean {
    return !this.excludedCollisionClasses.some(
      (excludedType) =>
        classType.prototype instanceof excludedType || classType === excludedType,
    );
  }
}
