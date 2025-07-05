import { BaseStaticCollidingGameEntity } from "../entities/base-static-colliding-game-entity.js";
import { BaseDynamicCollidingGameEntity } from "../entities/base-dynamic-colliding-game-entity.js";
import { HitboxEntity } from "../entities/hitbox-entity.js";
import { BaseMultiplayerScene } from "./base-multiplayer-scene.js";
import type { GameState } from "../services/game-state.js";
import { EventConsumerService } from "../services/event-consumer-service.js";

export class BaseCollidingGameScene extends BaseMultiplayerScene {
  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);
    this.detectCollisions();
  }

  public detectCollisions(): void {
    const collidingObjects: BaseStaticCollidingGameEntity[] =
      this.worldEntities.filter(
        (sceneObject) =>
          sceneObject instanceof BaseStaticCollidingGameEntity ||
          sceneObject instanceof BaseDynamicCollidingGameEntity
      ) as unknown as BaseStaticCollidingGameEntity[];

    collidingObjects.forEach((collidingObject) => {
      // Reset colliding state for hitboxes
      collidingObject.getHitboxEntities().forEach((hitbox) => {
        hitbox.setColliding(false);
      });

      collidingObjects.forEach((otherCollidingObject) => {
        if (collidingObject === otherCollidingObject) {
          return;
        }

        this.detectStaticAndDynamicCollisions(
          collidingObject,
          otherCollidingObject
        );
      });

      if (collidingObject.isColliding() === false) {
        collidingObject.setAvoidingCollision(false);
      }
    });
  }

  private detectStaticAndDynamicCollisions(
    collidingObject:
      | BaseStaticCollidingGameEntity
      | BaseDynamicCollidingGameEntity,
    otherCollidingObject:
      | BaseStaticCollidingGameEntity
      | BaseDynamicCollidingGameEntity
  ): void {
    const hitboxes = collidingObject.getHitboxEntities();
    const otherHitboxes = otherCollidingObject.getHitboxEntities();

    if (this.doesHitboxesIntersect(hitboxes, otherHitboxes) === false) {
      collidingObject.removeCollidingEntity(otherCollidingObject);
      otherCollidingObject.removeCollidingEntity(collidingObject);
      return;
    }

    collidingObject.addCollidingEntity(otherCollidingObject);
    otherCollidingObject.addCollidingEntity(collidingObject);

    if (
      collidingObject.hasRigidBody() === false ||
      otherCollidingObject.hasRigidBody() === false
    ) {
      return;
    }

    const areDynamicObjectsColliding =
      collidingObject instanceof BaseDynamicCollidingGameEntity &&
      otherCollidingObject instanceof BaseDynamicCollidingGameEntity;

    const isDynamicObjectCollidingWithStatic =
      collidingObject instanceof BaseDynamicCollidingGameEntity &&
      otherCollidingObject instanceof BaseStaticCollidingGameEntity;

    if (areDynamicObjectsColliding) {
      this.simulateCollisionBetweenDynamicObjects(
        collidingObject,
        otherCollidingObject
      );
    } else if (isDynamicObjectCollidingWithStatic) {
      if (collidingObject.isAvoidingCollision()) {
        return;
      }

      this.simulateCollisionBetweenDynamicAndStaticObjects(collidingObject);
    }
  }

  private doesHitboxesIntersect(
    hitboxObjects: HitboxEntity[],
    otherHitboxEntities: HitboxEntity[]
  ) {
    let intersecting = false;

    hitboxObjects.forEach((hitbox) => {
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

  private simulateCollisionBetweenDynamicAndStaticObjects(
    dynamicCollidingObject: BaseDynamicCollidingGameEntity
  ) {
    let vx = -dynamicCollidingObject.getVX();
    let vy = -dynamicCollidingObject.getVY();

    // Impulse to avoid becoming stuck
    if (vx > -1 && vx < 1) {
      vx = vx < 0 ? -1 : 1;
    }

    if (vy > -1 && vy < 1) {
      vy = vy < 0 ? -1 : 1;
    }

    dynamicCollidingObject.setAvoidingCollision(true);
    dynamicCollidingObject.setVX(vx);
    dynamicCollidingObject.setVY(vy);
  }

  private simulateCollisionBetweenDynamicObjects(
    dynamicCollidingObject: BaseDynamicCollidingGameEntity,
    otherDynamicCollidingObject: BaseDynamicCollidingGameEntity
  ) {
    // Calculate collision vector
    const vCollision = {
      x: otherDynamicCollidingObject.getX() - dynamicCollidingObject.getX(),
      y: otherDynamicCollidingObject.getY() - dynamicCollidingObject.getY(),
    };

    // Calculate distance between objects
    const distance = Math.sqrt(
      Math.pow(vCollision.x, 2) + Math.pow(vCollision.y, 2)
    );

    // Normalize collision vector
    const vCollisionNorm = {
      x: vCollision.x / distance,
      y: vCollision.y / distance,
    };

    // Calculate relative velocity
    const vRelativeVelocity = {
      x: otherDynamicCollidingObject.getVX() - dynamicCollidingObject.getVX(),
      y: otherDynamicCollidingObject.getVY() - dynamicCollidingObject.getVY(),
    };

    // Calculate speed along collision normal
    const speed =
      vRelativeVelocity.x * vCollisionNorm.x +
      vRelativeVelocity.y * vCollisionNorm.y;

    if (speed < 0) {
      // Collision has already been resolved
      return;
    }

    // Calculate impulse
    const impulse =
      (2 * speed) /
      (dynamicCollidingObject.getMass() +
        otherDynamicCollidingObject.getMass());

    // Update velocities for both movable objects
    const impulseX =
      impulse * otherDynamicCollidingObject.getMass() * vCollisionNorm.x;
    const impulseY =
      impulse * otherDynamicCollidingObject.getMass() * vCollisionNorm.y;

    dynamicCollidingObject.setVX(dynamicCollidingObject.getVX() + impulseX);
    dynamicCollidingObject.setVY(dynamicCollidingObject.getVY() + impulseY);

    otherDynamicCollidingObject.setVX(
      otherDynamicCollidingObject.getVX() - impulseX
    );
    otherDynamicCollidingObject.setVY(
      otherDynamicCollidingObject.getVY() - impulseY
    );
  }
}
