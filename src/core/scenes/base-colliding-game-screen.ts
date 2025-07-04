import { BaseStaticCollidingGameObject } from "../entities/base-static-colliding-game-object.js";
import { BaseDynamicCollidingGameObject } from "../entities/base-dynamic-colliding-game-object.js";
import { HitboxObject } from "../entities/hitbox-object.js";
import { BaseMultiplayerScreen } from "./base-multiplayer-screen.js";
import type { GameState } from "../services/game-state.js";
import { EventConsumerService } from "../services/event-consumer-service.js";

export class BaseCollidingGameScreen extends BaseMultiplayerScreen {
  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);
    this.detectCollisions();
  }

  public detectCollisions(): void {
    const collidingObjects: BaseStaticCollidingGameObject[] =
      this.sceneObjects.filter(
        (sceneObject) =>
          sceneObject instanceof BaseStaticCollidingGameObject ||
          sceneObject instanceof BaseDynamicCollidingGameObject
      ) as unknown as BaseStaticCollidingGameObject[];

    collidingObjects.forEach((collidingObject) => {
      // Reset colliding state for hitboxes
      collidingObject.getHitboxObjects().forEach((hitbox) => {
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
      | BaseStaticCollidingGameObject
      | BaseDynamicCollidingGameObject,
    otherCollidingObject:
      | BaseStaticCollidingGameObject
      | BaseDynamicCollidingGameObject
  ): void {
    const hitboxes = collidingObject.getHitboxObjects();
    const otherHitboxes = otherCollidingObject.getHitboxObjects();

    if (this.doesHitboxesIntersect(hitboxes, otherHitboxes) === false) {
      collidingObject.removeCollidingObject(otherCollidingObject);
      otherCollidingObject.removeCollidingObject(collidingObject);
      return;
    }

    collidingObject.addCollidingObject(otherCollidingObject);
    otherCollidingObject.addCollidingObject(collidingObject);

    if (
      collidingObject.hasRigidBody() === false ||
      otherCollidingObject.hasRigidBody() === false
    ) {
      return;
    }

    const areDynamicObjectsColliding =
      collidingObject instanceof BaseDynamicCollidingGameObject &&
      otherCollidingObject instanceof BaseDynamicCollidingGameObject;

    const isDynamicObjectCollidingWithStatic =
      collidingObject instanceof BaseDynamicCollidingGameObject &&
      otherCollidingObject instanceof BaseStaticCollidingGameObject;

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
    hitboxObjects: HitboxObject[],
    otherHitboxObjects: HitboxObject[]
  ) {
    let intersecting = false;

    hitboxObjects.forEach((hitbox) => {
      otherHitboxObjects.forEach((otherHitbox) => {
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
    dynamicCollidingObject: BaseDynamicCollidingGameObject
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
    dynamicCollidingObject: BaseDynamicCollidingGameObject,
    otherDynamicCollidingObject: BaseDynamicCollidingGameObject
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
