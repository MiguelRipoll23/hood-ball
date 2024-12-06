import { HitboxObject } from "../common/hitbox-object.js";
import { BaseAnimatedGameObject } from "./base-animated-object.js";

type CollidableGameObjectConstructor = new (
  ...args: never[]
) => BaseStaticCollidableGameObject;

export class BaseStaticCollidableGameObject extends BaseAnimatedGameObject {
  protected rigidBody = true;
  protected hitboxObjects: HitboxObject[] = [];

  private collidingObjects: BaseStaticCollidableGameObject[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidableGameObjectConstructor[] = [];

  public override load(): void {
    this.hitboxObjects.forEach((object) => object.setDebug(this.debug));
    super.load();
  }

  public hasRigidBody(): boolean {
    return this.rigidBody;
  }

  public isColliding(): boolean {
    return this.collidingObjects
      .filter((object) =>
        this.isCollisionClassIncluded(
          object.constructor as CollidableGameObjectConstructor
        )
      )
      .some((object) => object.hasRigidBody());
  }

  public getHitboxObjects(): HitboxObject[] {
    return this.hitboxObjects;
  }

  public setHitboxObjects(hitboxObjects: HitboxObject[]): void {
    this.hitboxObjects = hitboxObjects;
  }

  public getCollidingObjects(): BaseStaticCollidableGameObject[] {
    return this.collidingObjects;
  }

  public addCollidingObject(
    collidingObject: BaseStaticCollidableGameObject
  ): void {
    if (this.collidingObjects.includes(collidingObject) === false) {
      this.collidingObjects.push(collidingObject);
    }
  }

  public removeCollidingObject(
    collidingObject: BaseStaticCollidableGameObject
  ): void {
    this.collidingObjects = this.collidingObjects.filter(
      (object) => object !== collidingObject
    );
  }

  public isAvoidingCollision(): boolean {
    return this.avoidingCollision;
  }

  public setAvoidingCollision(avoidingCollision: boolean): void {
    this.avoidingCollision = avoidingCollision;
  }

  public addCollisionExclusion(
    classType: CollidableGameObjectConstructor
  ): void {
    if (!this.excludedCollisionClasses.includes(classType)) {
      this.excludedCollisionClasses.push(classType);
    }
  }

  public removeCollisionExclusion(
    classType: CollidableGameObjectConstructor
  ): void {
    this.excludedCollisionClasses = this.excludedCollisionClasses.filter(
      (type) => type !== classType
    );
  }

  public render(context: CanvasRenderingContext2D): void {
    this.hitboxObjects.forEach((object) => object.render(context));
  }

  private isCollisionClassIncluded(
    classType: CollidableGameObjectConstructor
  ): boolean {
    return !this.excludedCollisionClasses.some(
      (excludedType) =>
        classType.prototype instanceof excludedType ||
        classType === excludedType
    );
  }
}
