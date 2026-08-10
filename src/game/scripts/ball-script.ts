import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";
import { CarEntity } from "../entities/car-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { MathUtils } from "../../engine/utils/math-utils.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";
import type { DebugSettings } from "../../engine/models/debug-settings.js";
import { TELEPORT_SKIP_FRAMES } from "../constants/entity-constants.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

export class BallScript implements ScriptLifecycle {
  private readonly RADIUS = 20;
  private readonly FRICTION = 0.01;
  private readonly MIN_VELOCITY = 0.1;
  private readonly MAX_VELOCITY = 10;

  private transform!: TransformComponent;
  private physics!: PhysicsComponent;
  private collision!: CollisionComponent;

  radius: number = this.RADIUS;
  inactive: boolean = false;
  lastPlayer: GamePlayer | null = null;
  weatherFrictionMultiplier = 1.0;
  debugSettings: DebugSettings | null = null;
  private teleportFrameCount = 0;

  setInactive(v: boolean): void { this.inactive = v; }
  getLastPlayer(): GamePlayer | null { return this.lastPlayer; }
  clearLastPlayerIfMatches(player: GamePlayer): void {
    if (this.lastPlayer === player) this.lastPlayer = null;
  }
  setWeatherFrictionMultiplier(m: number): void { this.weatherFrictionMultiplier = m; }

  resolveComponents(t: TransformComponent, p: PhysicsComponent, c: CollisionComponent): void {
    this.transform = t;
    this.physics = p;
    this.collision = c;
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  init(x: number, y: number): void {
    this.transform.x = x;
    this.transform.y = y;
    this.transform.width = this.RADIUS * 2;
    this.transform.height = this.RADIUS * 2;
    this.physics.mass = 1;
    this.physics.bounciness = 0.8;
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.transform.teleport(canvasWidth / 2, canvasHeight / 2);
    this.physics.resetVelocity();
    this.inactive = false;
  }

  setCenterPosition(canvasWidth: number, canvasHeight: number): void {
    this.transform.x = canvasWidth / 2;
    this.transform.y = canvasHeight / 2;
    this.transform.skipInterpolation = true;
  }

  teleport(x: number, y: number, angle?: number): void {
    this.transform.teleport(x, y, angle);
    this.physics.resetVelocity();
    this.teleportFrameCount = TELEPORT_SKIP_FRAMES;
    this.updateHitbox();
  }

  mustSync(): boolean {
    return this.physics.vx !== 0 || this.physics.vy !== 0;
  }

  // ── Network ────────────────────────────────────────────────────

  serialize(): ArrayBuffer {
    return BinaryWriter.build()
      .unsignedInt16(this.transform.x)
      .unsignedInt16(this.transform.y)
      .signedInt16(this.physics.vx)
      .signedInt16(this.physics.vy)
      .toArrayBuffer();
  }

  synchronize(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const newX = reader.unsignedInt16();
    const newY = reader.unsignedInt16();
    const shouldSkip = this.transform.skipInterpolation || this.teleportFrameCount > 0;

    if (shouldSkip) {
      this.transform.x = newX;
      this.transform.y = newY;
      this.transform.skipInterpolation = false;
      if (this.teleportFrameCount > 0) this.teleportFrameCount--;
    } else {
      this.transform.x = MathUtils.lerp(this.transform.x, newX, 0.5);
      this.transform.y = MathUtils.lerp(this.transform.y, newY, 0.5);
    }

    this.physics.vx = reader.signedInt16();
    this.physics.vy = reader.signedInt16();
    this.updateHitbox();
  }

  getReplayState(): ArrayBuffer {
    return BinaryWriter.build()
      .unsignedInt16(this.transform.x)
      .unsignedInt16(this.transform.y)
      .signedInt16(this.physics.vx)
      .signedInt16(this.physics.vy)
      .toArrayBuffer();
  }

  applyReplayState(arrayBuffer: ArrayBuffer): void {
    if (!arrayBuffer || arrayBuffer.byteLength < 8) {
      EngineLogger.warn("BallScript", `applyReplayState invalid buffer: ${arrayBuffer ? arrayBuffer.byteLength : 0}`);
      return;
    }
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.transform.x = reader.unsignedInt16();
    this.transform.y = reader.unsignedInt16();
    this.physics.vx = reader.signedInt16();
    this.physics.vy = reader.signedInt16();
    this.updateHitbox();
  }

  // ── ScriptLifecycle ───────────────────────────────────────────

  update(_delta: DOMHighResTimeStamp): void {
    this.applyFriction();
    this.calculateMovement();
    this.updateHitbox();
    this.handlePlayerCollision();
    if (this.physics.vx !== 0 || this.physics.vy !== 0) {
      this.transform.angle = Math.atan2(-this.physics.vy, -this.physics.vx);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.drawBall(context);
    if (this.inactive) {
      context.shadowColor = "rgba(255, 215, 0, 1)"; context.shadowBlur = 25; context.shadowOffsetX = 0; context.shadowOffsetY = 0;
      context.beginPath(); context.fillStyle = "rgba(255, 255, 255, 1)";
      context.arc(this.transform.x, this.transform.y, this.radius, 0, Math.PI * 2);
      context.fill(); context.closePath();
    }
    context.restore();
    if (this.debugSettings?.isDebugging()) {
      DebugUtils.renderText(context, this.transform.x - this.radius, this.transform.y + this.radius + 5,
        `X(${Math.round(this.transform.x)}) Y(${Math.round(this.transform.y)})`);
    }
  }

  private drawBall(context: CanvasRenderingContext2D): void {
    const g = context.createRadialGradient(
      this.transform.x - this.radius * 0.3, this.transform.y - this.radius * 0.3, this.radius * 0.1,
      this.transform.x, this.transform.y, this.radius);
    g.addColorStop(0, "white"); g.addColorStop(1, "rgba(200, 200, 200, 1)");
    context.beginPath(); context.fillStyle = g;
    context.arc(this.transform.x, this.transform.y, this.radius, 0, Math.PI * 2);
    context.fill(); context.closePath();
  }

  // ── Hitbox ────────────────────────────────────────────────────

  createHitbox(): void {
    this.collision.hitboxEntities = [
      new HitboxEntity(
        this.transform.x - this.RADIUS * 2,
        this.transform.y - this.RADIUS * 2,
        this.RADIUS * 2,
        this.RADIUS * 2,
      ),
    ];
  }

  updateHitbox(): void {
    this.collision.hitboxEntities.forEach((entity) => {
      entity.setX(this.transform.x - this.RADIUS);
      entity.setY(this.transform.y - this.RADIUS);
    });
  }

  handleGoalScored(): void {
    this.inactive = true;
    this.physics.vx = -this.physics.vx * 2;
    this.physics.vy = -this.physics.vy * 2;
  }

  getTrajectoryPoints(steps = 60): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const effFriction = this.FRICTION * this.weatherFrictionMultiplier;
    let px = this.transform.x, py = this.transform.y;
    let vx = this.physics.vx, vy = this.physics.vy;
    for (let i = 0; i < steps; i++) {
      vx *= 1 - effFriction; vy *= 1 - effFriction;
      if (Math.abs(vx) < this.MIN_VELOCITY) vx = 0;
      if (Math.abs(vy) < this.MIN_VELOCITY) vy = 0;
      if (vx === 0 && vy === 0) break;
      px -= vx; py -= vy;
      points.push({ x: px, y: py });
    }
    return points;
  }

  private applyFriction(): void {
    const eff = this.FRICTION * this.weatherFrictionMultiplier;
    this.physics.vx *= 1 - eff; this.physics.vy *= 1 - eff;
    if (Math.abs(this.physics.vx) < this.MIN_VELOCITY) this.physics.vx = 0;
    if (Math.abs(this.physics.vy) < this.MIN_VELOCITY) this.physics.vy = 0;
    this.limitVelocity();
  }

  private calculateMovement(): void {
    this.transform.x -= this.physics.vx;
    this.transform.y -= this.physics.vy;
  }

  private handlePlayerCollision(): void {
    this.collision.collidingEntities.forEach((entity) => {
      if (entity instanceof CarEntity) this.lastPlayer = entity.getPlayer();
    });
  }

  private limitVelocity(): void {
    const speed = Math.sqrt(this.physics.vx ** 2 + this.physics.vy ** 2);
    if (speed > this.MAX_VELOCITY) {
      const s = this.MAX_VELOCITY / speed;
      this.physics.vx *= s; this.physics.vy *= s;
    }
  }
}
