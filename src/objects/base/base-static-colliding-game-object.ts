import { HitboxObject } from "../common/hitbox-object.js";
import { BaseAnimatedGameObject } from "./base-animated-object.js";

type CollidingGameObjectConstructor = new (
  ...args: never[]
) => BaseStaticCollidingGameObject;

export class BaseStaticCollidingGameObject extends BaseAnimatedGameObject {
  protected rigidBody = true;
  protected hitboxObjects: HitboxObject[] = [];

  private collidingObjects: BaseStaticCollidingGameObject[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidingGameObjectConstructor[] = [];

  public override load(): void {
    this.hitboxObjects.forEach((object) =>
      object.setDebugSettings(this.debugSettings)
    );

    super.load();
  }

  public hasRigidBody(): boolean {
    return this.rigidBody;
  }

  public isColliding(): boolean {
    return this.collidingObjects.some(
      (object) =>
        this.isCollisionClassIncluded(
          object.constructor as CollidingGameObjectConstructor
        ) && object.hasRigidBody()
    );
  }

  public isCollidingWithStatic(): boolean {
    return this.collidingObjects.some(
      (object) =>
        this.isCollisionClassIncluded(
          object.constructor as CollidingGameObjectConstructor
        ) &&
        !object.isDynamic() &&
        object.hasRigidBody()
    );
  }

  public isDynamic(): boolean {
    return false;
  }

  public getHitboxObjects(): HitboxObject[] {
    return this.hitboxObjects;
  }

  public setHitboxObjects(hitboxObjects: HitboxObject[]): void {
    this.hitboxObjects = hitboxObjects;
  }

  public getCollidingObjects(): BaseStaticCollidingGameObject[] {
    return this.collidingObjects;
  }

  public addCollidingObject(
    collidingObject: BaseStaticCollidingGameObject
  ): void {
    if (this.collidingObjects.includes(collidingObject) === false) {
      this.collidingObjects.push(collidingObject);
    }
  }

  public removeCollidingObject(
    collidingObject: BaseStaticCollidingGameObject
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
    classType: CollidingGameObjectConstructor
  ): void {
    if (!this.excludedCollisionClasses.includes(classType)) {
      this.excludedCollisionClasses.push(classType);
    }
  }

  public removeCollisionExclusion(
    classType: CollidingGameObjectConstructor
  ): void {
    this.excludedCollisionClasses = this.excludedCollisionClasses.filter(
      (type) => type !== classType
    );
  }

  public render(context: CanvasRenderingContext2D): void {
    this.hitboxObjects.forEach((object) => object.render(context));
  }

  private isCollisionClassIncluded(
    classType: CollidingGameObjectConstructor
  ): boolean {
    return !this.excludedCollisionClasses.some(
      (excludedType) =>
        classType.prototype instanceof excludedType ||
        classType === excludedType
    );
  }
}
