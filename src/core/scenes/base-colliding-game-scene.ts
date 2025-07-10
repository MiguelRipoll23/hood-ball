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

  private simulateCollisionBetweenDynamicAndStaticEntities(
    dynamicCollidingEntity: BaseDynamicCollidingGameEntity
  ) {
    let vx = -dynamicCollidingEntity.getVX();
    let vy = -dynamicCollidingEntity.getVY();

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
    const normal = {
      x: vCollision.x / distance,
      y: vCollision.y / distance,
    };

    const tangent = {
      x: -normal.y,
      y: normal.x,
    };

    // Project velocities onto the normal and tangent vectors
    const dpTan1 =
      dynamicCollidingEntity.getVX() * tangent.x +
      dynamicCollidingEntity.getVY() * tangent.y;
    const dpTan2 =
      otherDynamicCollidingEntity.getVX() * tangent.x +
      otherDynamicCollidingEntity.getVY() * tangent.y;

    const dpNorm1 =
      dynamicCollidingEntity.getVX() * normal.x +
      dynamicCollidingEntity.getVY() * normal.y;
    const dpNorm2 =
      otherDynamicCollidingEntity.getVX() * normal.x +
      otherDynamicCollidingEntity.getVY() * normal.y;

    // One dimensional elastic collision along the normal
    const m1 =
      (dpNorm1 * (dynamicCollidingEntity.getMass() - otherDynamicCollidingEntity.getMass()) +
        2 * otherDynamicCollidingEntity.getMass() * dpNorm2) /
      (dynamicCollidingEntity.getMass() + otherDynamicCollidingEntity.getMass());
    const m2 =
      (dpNorm2 * (otherDynamicCollidingEntity.getMass() - dynamicCollidingEntity.getMass()) +
        2 * dynamicCollidingEntity.getMass() * dpNorm1) /
      (dynamicCollidingEntity.getMass() + otherDynamicCollidingEntity.getMass());

    const RESTITUTION = 0.9;

    dynamicCollidingEntity.setVX(
      tangent.x * dpTan1 + normal.x * m1 * RESTITUTION
    );
    dynamicCollidingEntity.setVY(
      tangent.y * dpTan1 + normal.y * m1 * RESTITUTION
    );

    otherDynamicCollidingEntity.setVX(
      tangent.x * dpTan2 + normal.x * m2 * RESTITUTION
    );
    otherDynamicCollidingEntity.setVY(
      tangent.y * dpTan2 + normal.y * m2 * RESTITUTION
    );
  }
}
