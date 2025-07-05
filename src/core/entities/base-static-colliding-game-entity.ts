import { HitboxEntity } from "./hitbox-entity.js";
import { BaseAnimatedGameEntity } from "./base-animated-entity.js";

type CollidingGameEntityConstructor = new (
  ...args: never[]
) => BaseStaticCollidingGameEntity;

export class BaseStaticCollidingGameEntity extends BaseAnimatedGameEntity {
  protected rigidBody = true;
  protected hitboxObjects: HitboxEntity[] = [];

  private collidingObjects: BaseStaticCollidingGameEntity[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidingGameEntityConstructor[] = [];

  public isDynamic(): boolean {
    return false;
  }

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
          object.constructor as CollidingGameEntityConstructor
        ) && object.hasRigidBody()
    );
  }

  public isCollidingWithStatic(): boolean {
    return this.collidingObjects.some(
      (object) =>
        this.isCollisionClassIncluded(
          object.constructor as CollidingGameEntityConstructor
        ) &&
        !object.isDynamic() &&
        object.hasRigidBody()
    );
  }

  public getHitboxEntities(): HitboxEntity[] {
    return this.hitboxObjects;
  }

  public setHitboxEntities(hitboxObjects: HitboxEntity[]): void {
    this.hitboxObjects = hitboxObjects;
  }

  public getCollidingObjects(): BaseStaticCollidingGameEntity[] {
    return this.collidingObjects;
  }

  public addCollidingEntity(
    collidingEntity: BaseStaticCollidingGameEntity
  ): void {
    if (this.collidingObjects.includes(collidingEntity) === false) {
      this.collidingObjects.push(collidingEntity);
    }
  }

  public removeCollidingEntity(
    collidingEntity: BaseStaticCollidingGameEntity
  ): void {
    this.collidingObjects = this.collidingObjects.filter(
      (object) => object !== collidingEntity
    );
  }

  public isAvoidingCollision(): boolean {
    return this.avoidingCollision;
  }

  public setAvoidingCollision(avoidingCollision: boolean): void {
    this.avoidingCollision = avoidingCollision;
  }

  public addCollisionExclusion(
    classType: CollidingGameEntityConstructor
  ): void {
    if (!this.excludedCollisionClasses.includes(classType)) {
      this.excludedCollisionClasses.push(classType);
    }
  }

  public removeCollisionExclusion(
    classType: CollidingGameEntityConstructor
  ): void {
    this.excludedCollisionClasses = this.excludedCollisionClasses.filter(
      (type) => type !== classType
    );
  }

  public render(context: CanvasRenderingContext2D): void {
    this.hitboxObjects.forEach((object) => object.render(context));
  }

  private isCollisionClassIncluded(
    classType: CollidingGameEntityConstructor
  ): boolean {
    return !this.excludedCollisionClasses.some(
      (excludedType) =>
        classType.prototype instanceof excludedType ||
        classType === excludedType
    );
  }
}
