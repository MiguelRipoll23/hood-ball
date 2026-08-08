import { HitboxEntity } from "./hitbox-entity.js";
import { BaseMoveableGameEntity } from "./base-moveable-game-entity.js";
import { PhysicsComponent } from "../components/physics-component.js";
import { CollisionComponent } from "../components/collision-component.js";

type CollidingGameEntityConstructor = new (
  ...args: never[]
) => BaseCollidingGameEntity;

/**
 * Unified colliding entity — replaces both BaseStaticCollidingGameEntity and
 * BaseDynamicCollidingGameEntity. A "static" collider is simply one with
 * {@link PhysicsComponent.isDynamic} = false and zero velocity.
 *
 * Debug overlays (gizmos, hitboxes) are rendered by the PhysicsComponent and
 * CollisionComponent respectively — no rendering code lives here.
 */
export class BaseCollidingGameEntity extends BaseMoveableGameEntity {
  /** Physics state — prefer accessing via {@code getComponent(PhysicsComponent)} for new code. */
  protected readonly physics: PhysicsComponent;

  // ── Collision (from old BaseStaticCollidingGameEntity) ─────────

  protected hitboxEntities: HitboxEntity[] = [];

  private collidingEntities: BaseCollidingGameEntity[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidingGameEntityConstructor[] = [];

  /** Backing CollisionComponent — use {@code getComponent(CollisionComponent)} for new code. */
  protected readonly collision: CollisionComponent;

  constructor() {
    super();
    this.physics = this.addComponent(new PhysicsComponent());
    this.physics.isDynamic = true; // default to dynamic — set false for static colliders
    this.collision = this.addComponent(new CollisionComponent());
  }

  // ── Dynamic / Static ───────────────────────────────────────────

  public isDynamic(): boolean {
    return this.physics.isDynamic;
  }

  // ── Physics accessors ──────────────────────────────────────────

  public getVX(): number {
    return this.physics.vx;
  }

  public setVX(vx: number): void {
    this.physics.vx = vx;
  }

  public getVY(): number {
    return this.physics.vy;
  }

  public setVY(vy: number): void {
    this.physics.vy = vy;
  }

  public getMass(): number {
    return this.physics.mass;
  }

  public getBounciness(): number {
    return this.physics.bounciness;
  }

  public setBounciness(bounciness: number): void {
    this.physics.bounciness = bounciness;
  }

  public hasRigidBody(): boolean {
    return this.physics.rigidBody;
  }

  // ── Collision accessors ────────────────────────────────────────

  public isColliding(): boolean {
    this.syncCollisionState();
    return this.collision.isColliding();
  }

  public isCollidingWithStatic(): boolean {
    this.syncCollisionState();
    return this.collision.isCollidingWithStatic();
  }

  public getHitboxEntities(): HitboxEntity[] {
    return this.hitboxEntities;
  }

  public setHitboxEntities(hitboxEntities: HitboxEntity[]): void {
    this.hitboxEntities = hitboxEntities;
    this.collision.hitboxEntities = hitboxEntities;
  }

  public getCollidingEntities(): BaseCollidingGameEntity[] {
    return this.collidingEntities;
  }

  public addCollidingEntity(collidingEntity: BaseCollidingGameEntity): void {
    if (this.collidingEntities.includes(collidingEntity) === false) {
      this.collidingEntities.push(collidingEntity);
      this.collision.collidingEntities.push(collidingEntity);
    }
  }

  public removeCollidingEntity(collidingEntity: BaseCollidingGameEntity): void {
    this.collidingEntities = this.collidingEntities.filter(
      (entity) => entity !== collidingEntity
    );
    this.collision.collidingEntities = this.collision.collidingEntities.filter(
      (entity) => entity !== collidingEntity
    );
  }

  public isAvoidingCollision(): boolean {
    return this.avoidingCollision;
  }

  public setAvoidingCollision(avoidingCollision: boolean): void {
    this.avoidingCollision = avoidingCollision;
    this.collision.avoidingCollision = avoidingCollision;
  }

  public addCollisionExclusion(classType: CollidingGameEntityConstructor): void {
    if (!this.excludedCollisionClasses.includes(classType)) {
      this.excludedCollisionClasses.push(classType);
      this.collision.addCollisionExclusion(classType);
    }
  }

  public removeCollisionExclusion(
    classType: CollidingGameEntityConstructor
  ): void {
    this.excludedCollisionClasses = this.excludedCollisionClasses.filter(
      (type) => type !== classType
    );
    this.collision.removeCollisionExclusion(classType);
  }

  // ── Teleport (resets physics velocity) ─────────────────────────

  public override teleport(x: number, y: number, angle?: number): void {
    super.teleport(x, y, angle);
    this.physics.resetVelocity();
  }

  public updateHitbox(): void {
    // Default implementation — subclasses override
  }

  // ── Render ─────────────────────────────────────────────────────

  /**
   * Debug overlays (gizmos, hitbox rectangles) are now rendered by
   * {@link PhysicsComponent.render} and {@link CollisionComponent.render}
   * respectively, invoked via the component lifecycle in
   * {@link BaseGameEntity.render}. This method only chains to the parent.
   */
  public override render(context: CanvasRenderingContext2D): void {
    super.render(context);
  }

  // ── Internal sync ──────────────────────────────────────────────

  private syncCollisionState(): void {
    this.collision.hitboxEntities = this.hitboxEntities;
    this.collision.collidingEntities = this.collidingEntities;
    this.collision.avoidingCollision = this.avoidingCollision;
  }
}
