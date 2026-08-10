import { HitboxEntity } from "../entities/hitbox-entity.js";
import { BaseMultiplayerScene } from "./base-multiplayer-scene.js";
import type { GameState } from "../models/game-state.js";
import { EventConsumerService } from "../services/gameplay/event-consumer-service.js";
import { BaseGameEntity } from "../entities/base-game-entity.js";
import { SpatialGrid } from "../utils/spatial-grid.js";
import { CollisionComponent } from "../components/collision-component.js";
import { PhysicsComponent } from "../components/physics-component.js";
import { TransformComponent } from "../components/transform-component.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants/canvas-constants.js";

const GRID_CELL_SIZE = 100;

interface GridEntry { getX(): number; getY(): number; entity: BaseGameEntity }

export class BaseCollidingGameScene extends BaseMultiplayerScene {
  protected isReplayMode = false;

  private readonly spatialGrid = new SpatialGrid<GridEntry>(
    GRID_CELL_SIZE,
    Math.ceil(CANVAS_WIDTH / GRID_CELL_SIZE),
    Math.ceil(CANVAS_HEIGHT / GRID_CELL_SIZE),
  );

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
  ) {
    super(gameState, eventConsumerService);
  }

  public getIsReplayMode(): boolean {
    return this.isReplayMode;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp, this.isReplayMode);
    if (!this.isReplayMode) {
      this.detectCollisions();
    }
  }

  public detectCollisions(): void {
    const entities = this.worldEntities.filter(
      (e): e is BaseGameEntity =>
        e instanceof BaseGameEntity &&
        e.hasComponent(CollisionComponent) &&
        e.hasComponent(PhysicsComponent) &&
        e.hasComponent(TransformComponent),
    );

    for (const e of entities) {
      const c = e.getComponent(CollisionComponent)!;
      for (const other of [...c.collidingEntities]) {
        const oc = (other as BaseGameEntity).getComponent(CollisionComponent);
        c.collidingEntities = c.collidingEntities.filter((x) => x !== other);
        if (oc) oc.collidingEntities = oc.collidingEntities.filter((x) => x !== e);
      }
      c.hitboxEntities.forEach((h) => h.setColliding(false));
    }

    this.spatialGrid.clear();
    for (const e of entities) {
      const t = e.getComponent(TransformComponent)!;
      this.spatialGrid.insert({ getX: () => t.x, getY: () => t.y, entity: e });
    }

    this.spatialGrid.forEachPair((a, b) => {
      this.detectCollisionsBetween(a.entity, b.entity);
    });

    for (const e of entities) {
      const c = e.getComponent(CollisionComponent)!;
      if (!c.isColliding()) {
        c.avoidingCollision = false;
      }
    }
  }

  private detectCollisionsBetween(
    a: BaseGameEntity,
    b: BaseGameEntity,
  ): void {
    const ca = a.getComponent(CollisionComponent)!;
    const cb = b.getComponent(CollisionComponent)!;

    if (!this.doesHitboxesIntersect(ca.hitboxEntities, cb.hitboxEntities)) {
      ca.collidingEntities = ca.collidingEntities.filter((x) => x !== b);
      cb.collidingEntities = cb.collidingEntities.filter((x) => x !== a);
      return;
    }

    ca.collidingEntities.push(b);
    cb.collidingEntities.push(a);

    const pa = a.getComponent(PhysicsComponent)!;
    const pb = b.getComponent(PhysicsComponent)!;

    if (!pa.rigidBody || !pb.rigidBody) return;

    if (pa.isDynamic && pb.isDynamic) {
      this.simulateCollisionBetweenDynamicEntities(a, pa, b, pb);
    } else if (pa.isDynamic && !pb.isDynamic) {
      if (ca.avoidingCollision) return;
      this.simulateCollisionBetweenDynamicAndStaticEntities(a, pa);
    }
  }

  private doesHitboxesIntersect(
    hitboxes: HitboxEntity[],
    others: HitboxEntity[],
  ): boolean {
    let intersecting = false;
    hitboxes.forEach((h) => {
      others.forEach((o) => {
        if (
          h.getX() < o.getX() + o.getWidth() &&
          h.getX() + h.getWidth() > o.getX() &&
          h.getY() < o.getY() + o.getHeight() &&
          h.getY() + h.getHeight() > o.getY()
        ) {
          intersecting = true;
          h.setColliding(true);
          o.setColliding(true);
        }
      });
    });
    return intersecting;
  }

  private calculatePenetrationCorrection(
    entity: BaseGameEntity,
  ): { x: number; y: number } {
    const c = entity.getComponent(CollisionComponent)!;
    let maxDepth = 0;
    let corrX = 0;
    let corrY = 0;

    for (const other of c.collidingEntities) {
      const otherEntity = other as BaseGameEntity;
      const op = otherEntity.getComponent(PhysicsComponent);
      if (!op || op.isDynamic || !op.rigidBody) continue;

      const oc = otherEntity.getComponent(CollisionComponent)!;
      for (const dh of c.hitboxEntities) {
        for (const sh of oc.hitboxEntities) {
          const dx1 = dh.getX(), dy1 = dh.getY(), dw = dh.getWidth(), dh_ = dh.getHeight();
          const sx1 = sh.getX(), sy1 = sh.getY(), sw = sh.getWidth(), sh_ = sh.getHeight();

          if (dx1 < sx1 + sw && dx1 + dw > sx1 && dy1 < sy1 + sh_ && dy1 + dh_ > sy1) {
            const pL = dx1 + dw - sx1, pR = sx1 + sw - dx1;
            const pT = dy1 + dh_ - sy1, pB = sy1 + sh_ - dy1;
            const mH = Math.min(pL, pR), mV = Math.min(pT, pB);

            if (mH < mV) {
              if (mH > maxDepth) {
                maxDepth = mH;
                corrX = pL < pR ? -pL : pR;
                corrY = 0;
              }
            } else {
              if (mV > maxDepth) {
                maxDepth = mV;
                corrX = 0;
                corrY = pT < pB ? -pT : pB;
              }
            }
          }
        }
      }
    }
    return { x: corrX, y: corrY };
  }

  private simulateCollisionBetweenDynamicAndStaticEntities(
    entity: BaseGameEntity,
    phys: PhysicsComponent,
  ): void {
    const t = entity.getComponent(TransformComponent)!;
    const correction = this.calculatePenetrationCorrection(entity);
    if (correction.x !== 0 || correction.y !== 0) {
      t.x += correction.x;
      t.y += correction.y;
      entity.getComponent(CollisionComponent)!.hitboxEntities.forEach((h) => {
        h.setX(t.x - h.getWidth() / 2);
        h.setY(t.y - h.getHeight() / 2);
      });
    }

    const rest = phys.bounciness;
    let vx = -phys.vx * rest;
    let vy = -phys.vy * rest;
    if (vx > -1 && vx < 1) vx = vx < 0 ? -1 : 1;
    if (vy > -1 && vy < 1) vy = vy < 0 ? -1 : 1;

    entity.getComponent(CollisionComponent)!.avoidingCollision = true;
    phys.vx = vx;
    phys.vy = vy;
  }

  private simulateCollisionBetweenDynamicEntities(
    a: BaseGameEntity, pa: PhysicsComponent,
    b: BaseGameEntity, pb: PhysicsComponent,
  ): void {
    const ta = a.getComponent(TransformComponent)!;
    const tb = b.getComponent(TransformComponent)!;

    const vCollision = { x: tb.x - ta.x, y: tb.y - ta.y };
    let distance = Math.sqrt(vCollision.x ** 2 + vCollision.y ** 2);
    const MIN_DISTANCE = 1;

    if (distance < MIN_DISTANCE) {
      if (distance === 0) {
        const ids = [a.getId(), b.getId()].sort().join("");
        let hash = 0;
        for (let i = 0; i < ids.length; i++) hash = (hash + ids.charCodeAt(i)) % 360;
        const angle = (hash / 360) * Math.PI * 2;
        vCollision.x = Math.cos(angle);
        vCollision.y = Math.sin(angle);
        distance = 1;
      }
      const pushX = (vCollision.x / distance) * MIN_DISTANCE;
      const pushY = (vCollision.y / distance) * MIN_DISTANCE;
      pa.vx -= pushX;
      pa.vy -= pushY;
      pb.vx += pushX;
      pb.vy += pushY;
      return;
    }

    const norm = { x: vCollision.x / distance, y: vCollision.y / distance };
    const relVel = { x: pb.vx - pa.vx, y: pb.vy - pa.vy };
    const speed = relVel.x * norm.x + relVel.y * norm.y;
    if (speed < 0) return;

    const rest = Math.min(pa.bounciness, pb.bounciness);
    const impulse = ((1 + rest) * speed) / (pa.mass + pb.mass);
    const ix = impulse * pb.mass * norm.x;
    const iy = impulse * pb.mass * norm.y;

    pa.vx += ix;
    pa.vy += iy;
    pb.vx -= ix;
    pb.vy -= iy;
  }
}
