import { HitboxEntity } from "./hitbox-entity.js";
import { BaseAnimatedGameEntity } from "./base-animated-entity.js";

type CollidingGameEntityConstructor = new (
  ...args: never[]
) => BaseStaticCollidingGameEntity;

export class BaseStaticCollidingGameEntity extends BaseAnimatedGameEntity {
  protected rigidBody = true;
  protected hitboxEntities: HitboxEntity[] = [];

  private collidingEntities: BaseStaticCollidingGameEntity[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidingGameEntityConstructor[] = [];

  public isDynamic(): boolean {
    return false;
  }

  public override load(): void {
    this.hitboxEntities.forEach((entity) =>
      entity.setDebugSettings(this.debugSettings)
    );

    super.load();
  }

  public hasRigidBody(): boolean {
    return this.rigidBody;
  }

  public isColliding(): boolean {
    return this.collidingEntities.some(
      (entity) =>
        this.isCollisionClassIncluded(
          entity.constructor as CollidingGameEntityConstructor
        ) && entity.hasRigidBody()
    );
  }

  public isCollidingWithStatic(): boolean {
    return this.collidingEntities.some(
      (entity) =>
        this.isCollisionClassIncluded(
          entity.constructor as CollidingGameEntityConstructor
        ) &&
        !entity.isDynamic() &&
        entity.hasRigidBody()
    );
  }

  public getHitboxEntities(): HitboxEntity[] {
    return this.hitboxEntities;
  }

  public setHitboxEntities(hitboxEntities: HitboxEntity[]): void {
    this.hitboxEntities = hitboxEntities;
  }

  public getCollidingEntities(): BaseStaticCollidingGameEntity[] {
    return this.collidingEntities;
  }

  public addCollidingEntity(
    collidingEntity: BaseStaticCollidingGameEntity
  ): void {
    if (this.collidingEntities.includes(collidingEntity) === false) {
      this.collidingEntities.push(collidingEntity);
    }
  }

  public removeCollidingEntity(
    collidingEntity: BaseStaticCollidingGameEntity
  ): void {
    this.collidingEntities = this.collidingEntities.filter(
      (entity) => entity !== collidingEntity
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
    this.hitboxEntities.forEach((entity) => entity.render(context));
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
