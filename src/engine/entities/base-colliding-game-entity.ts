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
 */
export class BaseCollidingGameEntity extends BaseMoveableGameEntity {
  /** Physics state — prefer accessing via this getComponent(PhysicsComponent) for new code. */
  protected readonly physics: PhysicsComponent;

  // ── Collision (from old BaseStaticCollidingGameEntity) ─────────

  protected hitboxEntities: HitboxEntity[] = [];

  private collidingEntities: BaseCollidingGameEntity[] = [];
  private avoidingCollision = false;
  private excludedCollisionClasses: CollidingGameEntityConstructor[] = [];

  /** Backing CollisionComponent – use getComponent(CollisionComponent) for new code. */
  protected readonly collision: CollisionComponent;

  // ── Debug gizmos ───────────────────────────────────────────────

  private static readonly LINE_LENGTH = 50;
  private static readonly ARROW_SIZE = 15;
  private static readonly CENTER_CIRCLE_RADIUS = 7;
  private static readonly CENTER_FILL_STYLE = "rgba(255, 255, 0, 0.6)";
  private static readonly CENTER_STROKE_STYLE = "yellow";
  private static readonly DIRECTION_STROKE_STYLE = "orange";
  private static readonly ARROW_ANGLE_OFFSET = Math.PI / 7;
  private static readonly LINE_WIDTH = 3;
  private static readonly CENTER_LINE_WIDTH = 2;

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

  public override load(): void {
    this.hitboxEntities.forEach((entity) =>
      entity.setDebugSettings(this.debugSettings)
    );
    super.load();
  }

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

  // ── Render (debug gizmos + hitboxes) ───────────────────────────

  public override render(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.isDebugging()) {
      this.renderDebugGizmos(context);
    }
    this.hitboxEntities.forEach((entity) => entity.render(context));
    super.render(context);
  }

  private renderDebugGizmos(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.areGizmosVisible() === false) return;

    context.save();

    // Center circle
    context.fillStyle = BaseCollidingGameEntity.CENTER_FILL_STYLE;
    context.strokeStyle = BaseCollidingGameEntity.CENTER_STROKE_STYLE;
    context.lineWidth = BaseCollidingGameEntity.CENTER_LINE_WIDTH;
    context.beginPath();
    context.arc(
      this.x, this.y,
      BaseCollidingGameEntity.CENTER_CIRCLE_RADIUS,
      0, 2 * Math.PI,
    );
    context.fill();
    context.stroke();

    // Direction arrow
    const lineLength = BaseCollidingGameEntity.LINE_LENGTH;
    const endX = this.x + Math.cos(this.angle) * lineLength;
    const endY = this.y + Math.sin(this.angle) * lineLength;

    context.strokeStyle = BaseCollidingGameEntity.DIRECTION_STROKE_STYLE;
    context.lineWidth = BaseCollidingGameEntity.LINE_WIDTH;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();

    // Arrowhead
    const arrowSize = BaseCollidingGameEntity.ARROW_SIZE;
    context.fillStyle = BaseCollidingGameEntity.DIRECTION_STROKE_STYLE;
    context.beginPath();
    const a1 = this.angle + BaseCollidingGameEntity.ARROW_ANGLE_OFFSET;
    const a2 = this.angle - BaseCollidingGameEntity.ARROW_ANGLE_OFFSET;
    context.moveTo(endX, endY);
    context.lineTo(endX - arrowSize * Math.cos(a1), endY - arrowSize * Math.sin(a1));
    context.lineTo(endX - arrowSize * Math.cos(a2), endY - arrowSize * Math.sin(a2));
    context.closePath();
    context.fill();

    context.restore();
  }

  // ── Internal sync ──────────────────────────────────────────────

  private syncCollisionState(): void {
    this.collision.hitboxEntities = this.hitboxEntities;
    this.collision.collidingEntities = this.collidingEntities;
    this.collision.avoidingCollision = this.avoidingCollision;
  }
}
