import { BaseStaticCollidingGameEntity } from "../entities/base-static-colliding-game-entity.js";
import { BaseDynamicCollidingGameEntity } from "../entities/base-dynamic-colliding-game-entity.js";
import { HitboxEntity } from "../entities/hitbox-entity.js";
import { BaseMultiplayerScene } from "./base-multiplayer-scene.js";
import type { GameState } from "../models/game-state.js";
import { EventConsumerService } from "../services/gameplay/event-consumer-service.js";
import type { GameEntity } from "../models/game-entity.js";

export class BaseCollidingGameScene extends BaseMultiplayerScene {
  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    super(gameState, eventConsumerService);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);
    this.detectCollisions();
  }

  public detectCollisions(): void {
    const collidingEntities: BaseStaticCollidingGameEntity[] =
      this.worldEntities.filter(this.isCollidingEntity);

    collidingEntities.forEach((collidingEntity) => {
      // Reset colliding state for hitboxes
      collidingEntity.getHitboxEntities().forEach((hitbox) => {
        hitbox.setColliding(false);
      });

      collidingEntities.forEach((otherCollidingEntity) => {
        if (collidingEntity === otherCollidingEntity) {
          return;
        }

        this.detectStaticAndDynamicCollisions(
          collidingEntity,
          otherCollidingEntity
        );
      });

      if (collidingEntity.isColliding() === false) {
        collidingEntity.setAvoidingCollision(false);
      }
    });
  }

  private isCollidingEntity(
    gameEntity: GameEntity
  ): gameEntity is
    | BaseStaticCollidingGameEntity
    | BaseDynamicCollidingGameEntity {
    return (
      gameEntity instanceof BaseStaticCollidingGameEntity ||
      gameEntity instanceof BaseDynamicCollidingGameEntity
    );
  }

  private detectStaticAndDynamicCollisions(
    collidingEntity:
      | BaseStaticCollidingGameEntity
      | BaseDynamicCollidingGameEntity,
    otherCollidingEntity:
      | BaseStaticCollidingGameEntity
      | BaseDynamicCollidingGameEntity
  ): void {
    const hitboxes = collidingEntity.getHitboxEntities();
    const otherHitboxes = otherCollidingEntity.getHitboxEntities();

    if (this.doesHitboxesIntersect(hitboxes, otherHitboxes) === false) {
      collidingEntity.removeCollidingEntity(otherCollidingEntity);
      otherCollidingEntity.removeCollidingEntity(collidingEntity);
      return;
    }

    collidingEntity.addCollidingEntity(otherCollidingEntity);
    otherCollidingEntity.addCollidingEntity(collidingEntity);

    if (
      collidingEntity.hasRigidBody() === false ||
      otherCollidingEntity.hasRigidBody() === false
    ) {
      return;
    }

    const areDynamicEntitiesColliding =
      collidingEntity instanceof BaseDynamicCollidingGameEntity &&
      otherCollidingEntity instanceof BaseDynamicCollidingGameEntity;

    const isDynamicEntityCollidingWithStatic =
      collidingEntity instanceof BaseDynamicCollidingGameEntity &&
      otherCollidingEntity instanceof BaseStaticCollidingGameEntity;

    if (areDynamicEntitiesColliding) {
      this.simulateCollisionBetweenDynamicEntities(
        collidingEntity,
        otherCollidingEntity
      );
    } else if (isDynamicEntityCollidingWithStatic) {
      if (collidingEntity.isAvoidingCollision()) {
        return;
      }

      this.simulateCollisionBetweenDynamicAndStaticEntities(collidingEntity);
    }
  }

  private doesHitboxesIntersect(
    hitboxEntities: HitboxEntity[],
    otherHitboxEntities: HitboxEntity[]
  ) {
    let intersecting = false;

    hitboxEntities.forEach((hitbox) => {
      otherHitboxEntities.forEach((otherHitbox) => {
        if (
          hitbox.getX() < otherHitbox.getX() + otherHitbox.getWidth() &&
          hitbox.getX() + hitbox.getWidth() > otherHitbox.getX() &&
          hitbox.getY() < otherHitbox.getY() + otherHitbox.getHeight() &&
          hitbox.getY() + hitbox.getHeight() > otherHitbox.getY()
        ) {
          intersecting = true;
          hitbox.setColliding(true);
          otherHitbox.setColliding(true);
        }
      });
    });

    return intersecting;
  }

  private calculatePenetrationCorrection(
    dynamicEntity: BaseDynamicCollidingGameEntity
  ): { x: number; y: number } {
    const dynamicHitboxes = dynamicEntity.getHitboxEntities();
    let maxPenetrationX = 0;
    let maxPenetrationY = 0;
    let maxPenetrationDepth = 0;

    // Find the static entity we're colliding with
    const collidingEntities = dynamicEntity.getCollidingEntities();
    for (const staticEntity of collidingEntities) {
      if (staticEntity.isDynamic() || !staticEntity.hasRigidBody()) {
        continue;
      }

      const staticHitboxes = staticEntity.getHitboxEntities();

      // Check all hitbox pairs for penetration
      for (const dynamicHitbox of dynamicHitboxes) {
        for (const staticHitbox of staticHitboxes) {
          const dx1 = dynamicHitbox.getX();
          const dy1 = dynamicHitbox.getY();
          const dw = dynamicHitbox.getWidth();
          const dh = dynamicHitbox.getHeight();

          const sx1 = staticHitbox.getX();
          const sy1 = staticHitbox.getY();
          const sw = staticHitbox.getWidth();
          const sh = staticHitbox.getHeight();

          // Check if hitboxes intersect
          if (
            dx1 < sx1 + sw &&
            dx1 + dw > sx1 &&
            dy1 < sy1 + sh &&
            dy1 + dh > sy1
          ) {
            // Calculate penetration depths on each axis
            const penetrationLeft = dx1 + dw - sx1;
            const penetrationRight = sx1 + sw - dx1;
            const penetrationTop = dy1 + dh - sy1;
            const penetrationBottom = sy1 + sh - dy1;

            // Find the smallest penetration (the axis of least resistance)
            const minHorizontal = Math.min(penetrationLeft, penetrationRight);
            const minVertical = Math.min(penetrationTop, penetrationBottom);

            if (minHorizontal < minVertical) {
              // Horizontal correction is smaller
              const depth = minHorizontal;
              if (depth > maxPenetrationDepth) {
                maxPenetrationDepth = depth;
                maxPenetrationX =
                  penetrationLeft < penetrationRight
                    ? -penetrationLeft
                    : penetrationRight;
                maxPenetrationY = 0;
              }
            } else {
              // Vertical correction is smaller
              const depth = minVertical;
              if (depth > maxPenetrationDepth) {
                maxPenetrationDepth = depth;
                maxPenetrationX = 0;
                maxPenetrationY =
                  penetrationTop < penetrationBottom
                    ? -penetrationTop
                    : penetrationBottom;
              }
            }
          }
        }
      }
    }

    return { x: maxPenetrationX, y: maxPenetrationY };
  }

  private simulateCollisionBetweenDynamicAndStaticEntities(
    dynamicCollidingEntity: BaseDynamicCollidingGameEntity
  ) {
    // Calculate penetration depth and correction
    const correction = this.calculatePenetrationCorrection(
      dynamicCollidingEntity
    );

    // Apply position correction to push entity back inside bounds
    if (correction.x !== 0 || correction.y !== 0) {
      const currentX = dynamicCollidingEntity.getX();
      const currentY = dynamicCollidingEntity.getY();
      const newX = currentX + correction.x;
      const newY = currentY + correction.y;
      dynamicCollidingEntity.setX(newX);
      dynamicCollidingEntity.setY(newY);

      // Update hitboxes to match corrected position immediately
      // Let the entity update its hitboxes to match the corrected position
      dynamicCollidingEntity.updateHitbox();
    }

    const restitution = dynamicCollidingEntity.getBounciness();
    let vx = -dynamicCollidingEntity.getVX() * restitution;
    let vy = -dynamicCollidingEntity.getVY() * restitution;

    // Impulse to avoid becoming stuck
    if (vx > -1 && vx < 1) {
      vx = vx < 0 ? -1 : 1;
    }

    if (vy > -1 && vy < 1) {
      vy = vy < 0 ? -1 : 1;
    }

    dynamicCollidingEntity.setAvoidingCollision(true);
    dynamicCollidingEntity.setVX(vx);
    dynamicCollidingEntity.setVY(vy);
  }

  private simulateCollisionBetweenDynamicEntities(
    dynamicCollidingEntity: BaseDynamicCollidingGameEntity,
    otherDynamicCollidingEntity: BaseDynamicCollidingGameEntity
  ) {
    // Calculate collision vector
    const vCollision = {
      x: otherDynamicCollidingEntity.getX() - dynamicCollidingEntity.getX(),
      y: otherDynamicCollidingEntity.getY() - dynamicCollidingEntity.getY(),
    };

    // Calculate distance between entities
    let distance = Math.sqrt(
      Math.pow(vCollision.x, 2) + Math.pow(vCollision.y, 2)
    );

    const MIN_DISTANCE = 1;

    // If entities are extremely close, push them apart to avoid being stuck
    if (distance < MIN_DISTANCE) {
      if (distance === 0) {
        // Choose deterministic direction when they share the same position
        const idPair = [
          dynamicCollidingEntity.getId() ?? "",
          otherDynamicCollidingEntity.getId() ?? "",
        ]
          .sort()
          .join("");
        let hash = 0;
        for (let i = 0; i < idPair.length; i++) {
          hash = (hash + idPair.charCodeAt(i)) % 360;
        }
        const angle = (hash / 360) * Math.PI * 2;
        vCollision.x = Math.cos(angle);
        vCollision.y = Math.sin(angle);
        distance = 1;
      }

      const pushX = (vCollision.x / distance) * MIN_DISTANCE;
      const pushY = (vCollision.y / distance) * MIN_DISTANCE;

      dynamicCollidingEntity.setVX(dynamicCollidingEntity.getVX() - pushX);
      dynamicCollidingEntity.setVY(dynamicCollidingEntity.getVY() - pushY);

      otherDynamicCollidingEntity.setVX(otherDynamicCollidingEntity.getVX() + pushX);
      otherDynamicCollidingEntity.setVY(otherDynamicCollidingEntity.getVY() + pushY);

      return;
    }

    // Normalize collision vector
    const vCollisionNorm = {
      x: vCollision.x / distance,
      y: vCollision.y / distance,
    };

    // Calculate relative velocity
    const vRelativeVelocity = {
      x: otherDynamicCollidingEntity.getVX() - dynamicCollidingEntity.getVX(),
      y: otherDynamicCollidingEntity.getVY() - dynamicCollidingEntity.getVY(),
    };

    // Calculate speed along collision normal
    const speed =
      vRelativeVelocity.x * vCollisionNorm.x +
      vRelativeVelocity.y * vCollisionNorm.y;

    if (speed < 0) {
      // Collision has already been resolved
      return;
    }

    // Calculate impulse with restitution
    const restitution = Math.min(
      dynamicCollidingEntity.getBounciness(),
      otherDynamicCollidingEntity.getBounciness()
    );
    const impulse =
      ((1 + restitution) * speed) /
      (dynamicCollidingEntity.getMass() +
        otherDynamicCollidingEntity.getMass());

    // Update velocities for both movable entities
    const impulseX =
      impulse * otherDynamicCollidingEntity.getMass() * vCollisionNorm.x;
    const impulseY =
      impulse * otherDynamicCollidingEntity.getMass() * vCollisionNorm.y;

    dynamicCollidingEntity.setVX(dynamicCollidingEntity.getVX() + impulseX);
    dynamicCollidingEntity.setVY(dynamicCollidingEntity.getVY() + impulseY);

    otherDynamicCollidingEntity.setVX(
      otherDynamicCollidingEntity.getVX() - impulseX
    );
    otherDynamicCollidingEntity.setVY(
      otherDynamicCollidingEntity.getVY() - impulseY
    );
  }
}
