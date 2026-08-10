import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import type { PhysicsComponent } from "../../engine/components/physics-component.js";
import type { CollisionComponent } from "../../engine/components/collision-component.js";
import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";
import { BoostPadEntity } from "../entities/boost-pad-entity.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import type { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";
import {
  BLUE_TEAM_TRANSPARENCY_COLOR,
  RED_TEAM_TRANSPARENCY_COLOR,
} from "../constants/colors-constants.js";
import { SPAWN_ANGLE } from "../constants/entity-constants.js";
import {
  SCALE_FACTOR_FOR_ANGLES,
  SCALE_FACTOR_FOR_SPEED,
  SCALE_FACTOR_FOR_COORDINATES,
} from "../constants/webrtc-constants.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { MathUtils } from "../../engine/utils/math-utils.js";
import type { GamePlayer } from "../models/game-player.js";

/**
 * Script behaviour encapsulating a Car's per-frame game logic.
 * Attached to a CarEntity (or subclass) via ScriptComponent.
 */
export class CarScript implements ScriptLifecycle {
  // ── Configuration (set once, rarely changed) ──────────────────
  topSpeed: number = 0.3;
  acceleration: number = 0.002;
  readonly HANDLING: number = 0.007;

  // ── Runtime state ─────────────────────────────────────────────
  speed: number = 0;
  boost: number = 100;
  maxBoost: number = 100;
  boosting: boolean = false;

  demolished: boolean = false;
  respawnTimer: number = 0;
  respawnX: number = 0;
  respawnY: number = 0;

  weatherFrictionMultiplier: number = 1.0;

  canvas: HTMLCanvasElement | null = null;

  // ── Rendering state ───────────────────────────────────────────
  imagePath: string = "./images/car-blue.png";
  carImage: HTMLImageElement | null = null;
  isRemote: boolean = false;

  // ── Private constants ─────────────────────────────────────────
  private readonly FRICTION: number = 0.001;
  private readonly BOOST_DRAIN_RATE: number = 100;
  private readonly BOOST_TOP_SPEED_MULTIPLIER: number = 2;
  private readonly BOOST_ACCELERATION_MULTIPLIER: number = 2;
  private readonly TURBO_MIN_LENGTH = 15;
  private readonly TURBO_MAX_LENGTH = 30;
  private readonly TURBO_WIDTH = 15;
  private readonly SMOKE_DURATION = 1500;
  private readonly SMOKE_SPAWN_INTERVAL = 5;
  private readonly REFERENCE_DELTA = 1000 / 60;
  private readonly PLAYER_NAME_PADDING = 10;
  private readonly PLAYER_NAME_RECT_HEIGHT = 24;
  private readonly PLAYER_NAME_RADIUS = 10;
  private readonly PING_CIRCLE_RADIUS = 3;
  private readonly PING_CIRCLE_SPACING = 4;
  private readonly PING_ACTIVE_COLOR = "#C6FF00";
  private readonly PING_INACTIVE_COLOR = "#FF0000";

  private readonly IMAGE_BLUE_PATH = "./images/car-blue.png";
  private readonly IMAGE_RED_PATH = "./images/car-red.png";

  // ── Component references ──────────────────────────────────────
  public transform!: TransformComponent;
  public physics!: PhysicsComponent;
  public collision!: CollisionComponent;
  public entity!: BaseGameEntity;

  // ── Smoke ─────────────────────────────────────────────────────
  private smokeParticles: {
    x: number; y: number; size: number; life: number;
    vx: number; vy: number;
  }[] = [];
  private smokeSpawnElapsed: number = 0;

  constructor() {}

  /** Must be called after ScriptComponent is attached to the entity. */
  // Type constructors for external callers to use getComponent
  readonly transformCtor = TransformComponent as unknown as new (...args: never[]) => TransformComponent;
  readonly networkCtor = NetworkComponent as unknown as new (...args: never[]) => NetworkComponent;
  readonly inputCtor = InputComponent as unknown as new (...args: never[]) => InputComponent;

  init(x: number, y: number, angle: number, remote: boolean): void {
    this.transform.x = x;
    this.transform.y = y;
    this.transform.angle = angle;
    this.transform.width = 50;
    this.transform.height = 50;
    this.physics.mass = 1000;
    this.physics.bounciness = 0.5;
    this.isRemote = remote;
    this.imagePath = remote ? this.IMAGE_RED_PATH : this.IMAGE_BLUE_PATH;
  }

  reset(): void {
    this.transform.angle = 1.5708;
    this.speed = 0;
    this.boost = this.maxBoost;
    this.boosting = false;
  }

  setAngle(v: number): void { this.transform.angle = v; }
  getAngle(): number { return this.transform.angle; }

  resolveComponents(
    entity: BaseGameEntity,
    transform: TransformComponent,
    physics: PhysicsComponent,
    collision: CollisionComponent,
  ): void {
    this.entity = entity;
    this.transform = transform;
    this.physics = physics;
    this.collision = collision;
  }

  // ── Public API for subclasses / external callers ─────────────

  getBoost(): number { return this.boost; }
  setBoost(v: number): void { this.boost = v; }
  clampBoost(): void { this.boost = Math.max(0, Math.min(this.maxBoost, this.boost)); }

  getTopSpeed(): number { return this.topSpeed; }
  setTopSpeed(v: number): void { this.topSpeed = v; }

  getAcceleration(): number { return this.acceleration; }
  setAcceleration(v: number): void { this.acceleration = v; }

  isDemolished(): boolean { return this.demolished; }

  activateBoost(): void { if (this.boost > 0) this.boosting = true; }
  deactivateBoost(): void { this.boosting = false; }
  refillBoost(): void { this.boost = this.maxBoost; }

  setWeatherFrictionMultiplier(m: number): void { this.weatherFrictionMultiplier = m; }

  demolish(respawnX: number, respawnY: number, delay: number): void {
    this.demolished = true;
    this.respawnTimer = delay;
    this.respawnX = respawnX;
    this.respawnY = respawnY;
    this.speed = 0;
    this.physics.vx = 0;
    this.physics.vy = 0;
    this.boosting = false;
    this.entity.setOpacity(0);
    this.physics.rigidBody = false;
  }

  teleport(x: number, y: number, angle?: number): void {
    this.transform.teleport(x, y, angle);
    this.physics.resetVelocity();
    this.speed = 0;
    this.updateHitbox();
  }

  setRemote(v: boolean): void {
    this.isRemote = v;
    this.imagePath = v ? this.IMAGE_RED_PATH : this.IMAGE_BLUE_PATH;
  }

  // ── ScriptLifecycle ───────────────────────────────────────────

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.demolished) {
      this.respawnTimer -= deltaTimeStamp;
      if (this.respawnTimer <= 0) {
        this.demolished = false;
        this.physics.rigidBody = true;
        this.entity.setOpacity(1);
        this.transform.teleport(this.respawnX, this.respawnY, SPAWN_ANGLE);
      }
      return;
    }

    this.handleBoostPads();

    if (this.boosting) {
      this.smokeSpawnElapsed += deltaTimeStamp;
      if (this.smokeSpawnElapsed >= this.SMOKE_SPAWN_INTERVAL) {
        this.smokeSpawnElapsed = 0;
        this.spawnSmokeParticle();
      }
    } else {
      this.smokeSpawnElapsed = 0;
    }

    this.updateSmokeParticles(deltaTimeStamp);

    if (this.collision.isCollidingWithStatic()) {
      this.speed = 0;
    } else {
      this.applyFriction(deltaTimeStamp);
    }

    this.applyBoost(deltaTimeStamp);
    this.calculateMovement(deltaTimeStamp);
    this.updateHitbox();
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.demolished) return;

    this.renderSmokeTrail(context);
    context.save();

    context.translate(this.transform.x, this.transform.y);
    context.rotate(this.transform.angle);
    if (this.boosting) {
      this.renderTurboEffect(context);
    }
    context.drawImage(
      this.carImage!,
      -this.transform.width / 2,
      -this.transform.height / 2,
      this.transform.width,
      this.transform.height,
    );
    context.restore();

    const owner = this.entity.getOwner() as GamePlayer | null;
    if (owner?.isHost()) {
      this.renderHostIndicator(context);
    } else {
      this.renderPingLevel(context, owner);
    }

    this.renderPlayerName(context, owner);

    if (this.entity.debugSettings?.isDebugging()) {
      this.renderDebugInformation(context);
    }
  }

  /** Called from CarEntity.load() */
  createHitbox(): void {
    this.collision.hitboxEntities = [
      new HitboxEntity(
        this.transform.x - this.transform.width / 2,
        this.transform.y - this.transform.height / 2,
        this.transform.width,
        this.transform.height,
      ),
    ];
  }

  updateHitbox(): void {
    this.collision.hitboxEntities.forEach((h) => {
      h.setX(this.transform.x - this.transform.width / 2);
      h.setY(this.transform.y - this.transform.height / 2);
    });
  }

  /** Load the car image, calling onLoad when done. */
  loadCarImage(onLoad: () => void): void {
    this.carImage = new Image();
    this.carImage.onload = onLoad;
    this.carImage.src = this.imagePath;
  }

  getBoostTopSpeedMultiplier(): number { return this.BOOST_TOP_SPEED_MULTIPLIER; }

  // ── Serialization helpers ─────────────────────────────────────

  serializeNetworkData(writer: BinaryWriter): void {
    const angle = Math.round(this.transform.angle * SCALE_FACTOR_FOR_ANGLES);
    const speed = Math.round(this.speed * SCALE_FACTOR_FOR_SPEED);
    const boost = Math.round(this.boost);

    writer
      .unsignedInt16(Math.round(this.transform.x * SCALE_FACTOR_FOR_COORDINATES))
      .unsignedInt16(Math.round(this.transform.y * SCALE_FACTOR_FOR_COORDINATES))
      .signedInt16(angle)
      .signedInt16(speed)
      .boolean(this.boosting)
      .unsignedInt8(boost)
      .boolean(this.demolished);
  }

  /**
   * Parse a network sync payload and apply it with lerp smoothing.
   * Called by RemoteCarEntity.synchronize(). Returns updated teleportFrameCount.
   */
  synchronizeNetworkState(reader: BinaryReader, teleportFrameCount: number): number {
    const scaledX = reader.unsignedInt16();
    const scaledY = reader.unsignedInt16();
    const newX = scaledX / SCALE_FACTOR_FOR_COORDINATES;
    const newY = scaledY / SCALE_FACTOR_FOR_COORDINATES;
    const newAngle = reader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;

    const shouldSkipInterpolation =
      this.transform.skipInterpolation || teleportFrameCount > 0;

    if (shouldSkipInterpolation) {
      this.transform.x = newX;
      this.transform.y = newY;
      this.transform.angle = newAngle;
      this.transform.skipInterpolation = false;
      teleportFrameCount = Math.max(0, teleportFrameCount - 1);
    } else {
      this.transform.x = MathUtils.lerp(this.transform.x, newX, 0.5);
      this.transform.y = MathUtils.lerp(this.transform.y, newY, 0.5);
      this.transform.angle = MathUtils.lerp(this.transform.angle, newAngle, 0.5);
    }

    this.speed = reader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    this.boosting = reader.boolean();
    this.boost = reader.unsignedInt8();

    this.updateHitbox();
    return teleportFrameCount;
  }

  applyReplaySyncData(reader: BinaryReader): void {
    this.speed = reader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    this.boosting = reader.boolean();
    this.boost = reader.unsignedInt8();
    const newDemolished = reader.boolean();
    this.demolished = newDemolished;
    this.entity.setOpacity(newDemolished ? 0 : 1);
  }

  // ── Private helpers ───────────────────────────────────────────

  private applyFriction(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.speed !== 0) {
      const friction =
        this.FRICTION * deltaTimeStamp * this.weatherFrictionMultiplier;
      if (Math.abs(this.speed) <= friction) {
        this.speed = 0;
      } else {
        this.speed += -Math.sign(this.speed) * friction;
      }
    }
  }

  private applyBoost(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.boosting || this.boost <= 0) {
      this.boosting = false;
      return;
    }

    this.boost -= (this.BOOST_DRAIN_RATE * deltaTimeStamp) / 1000;

    if (this.speed < this.topSpeed * this.BOOST_TOP_SPEED_MULTIPLIER) {
      this.speed +=
        this.acceleration * this.BOOST_ACCELERATION_MULTIPLIER * deltaTimeStamp;
    }

    if (this.boost <= 0) {
      this.boost = 0;
      this.boosting = false;
    }
  }

  private handleBoostPads(): void {
    this.collision.collidingEntities.forEach((entity) => {
      if (entity instanceof BoostPadEntity && this.boost < this.maxBoost) {
        const playerId = this.entity.getOwner()?.getNetworkId();
        if (playerId && entity.tryConsume(playerId)) {
          this.refillBoost();
        }
      }
    });
  }

  private calculateMovement(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.collision.isColliding()) {
      // Let collision resolution handle velocity
    } else {
      this.physics.vx = Math.cos(this.transform.angle) * this.speed * deltaTimeStamp;
      this.physics.vy = Math.sin(this.transform.angle) * this.speed * deltaTimeStamp;
    }

    this.transform.x -= this.physics.vx;
    this.transform.y -= this.physics.vy;
  }

  // ── Rendering helpers ─────────────────────────────────────────

  private renderHostIndicator(context: CanvasRenderingContext2D): void {
    const startY =
      this.transform.y - this.transform.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 15;
    context.beginPath();
    context.arc(this.transform.x, startY, this.PING_CIRCLE_RADIUS, 0, Math.PI * 2);
    context.fillStyle = this.PING_ACTIVE_COLOR;
    context.fill();
    context.closePath();
  }

  private renderPingLevel(
    context: CanvasRenderingContext2D,
    owner: GamePlayer | null,
  ): void {
    const pingTime = owner?.getPingTime() ?? null;
    if (pingTime === null) return;

    let activeCircles = 3;
    if (pingTime > 800) activeCircles = 0;
    else if (pingTime > 400) activeCircles = 2;
    else if (pingTime > 200) activeCircles = 1;

    const totalWidth =
      3 * (2 * this.PING_CIRCLE_RADIUS) + 2 * this.PING_CIRCLE_SPACING;
    const startX = this.transform.x - totalWidth / 2 + 3;
    const startY =
      this.transform.y - this.transform.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 15;

    context.save();
    for (let i = 0; i < 3; i++) {
      const x =
        startX + i * (2 * this.PING_CIRCLE_RADIUS + this.PING_CIRCLE_SPACING);
      const color =
        i < activeCircles ? this.PING_ACTIVE_COLOR : this.PING_INACTIVE_COLOR;
      context.beginPath();
      context.arc(x, startY, this.PING_CIRCLE_RADIUS, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    }
    context.restore();
  }

  private renderPlayerName(
    context: CanvasRenderingContext2D,
    owner: GamePlayer | null,
  ): void {
    context.save();

    const playerName = owner?.getName() ?? "Unknown";
    context.font = "16px system-ui";

    const textWidth = context.measureText(playerName).width;
    const rectWidth = textWidth + this.PLAYER_NAME_PADDING * 1.8;

    const rectX = this.transform.x - rectWidth / 2;
    const rectY =
      this.transform.y - this.transform.height / 2 - this.PLAYER_NAME_RECT_HEIGHT - 5;

    context.fillStyle = this.isRemote
      ? RED_TEAM_TRANSPARENCY_COLOR
      : BLUE_TEAM_TRANSPARENCY_COLOR;

    context.beginPath();
    context.moveTo(rectX + this.PLAYER_NAME_RADIUS, rectY);
    context.lineTo(rectX + rectWidth - this.PLAYER_NAME_RADIUS, rectY);
    context.arcTo(
      rectX + rectWidth, rectY,
      rectX + rectWidth, rectY + this.PLAYER_NAME_RADIUS,
      this.PLAYER_NAME_RADIUS,
    );
    context.lineTo(
      rectX + rectWidth,
      rectY + this.PLAYER_NAME_RECT_HEIGHT - this.PLAYER_NAME_RADIUS,
    );
    context.arcTo(
      rectX + rectWidth,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
      rectX + rectWidth - this.PLAYER_NAME_RADIUS,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
      this.PLAYER_NAME_RADIUS,
    );
    context.lineTo(
      rectX + this.PLAYER_NAME_RADIUS,
      rectY + this.PLAYER_NAME_RECT_HEIGHT,
    );
    context.arcTo(
      rectX, rectY + this.PLAYER_NAME_RECT_HEIGHT,
      rectX, rectY + this.PLAYER_NAME_RECT_HEIGHT - this.PLAYER_NAME_RADIUS,
      this.PLAYER_NAME_RADIUS,
    );
    context.lineTo(rectX, rectY + this.PLAYER_NAME_RADIUS);
    context.arcTo(
      rectX, rectY,
      rectX + this.PLAYER_NAME_RADIUS, rectY,
      this.PLAYER_NAME_RADIUS,
    );
    context.closePath();
    context.fill();

    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      playerName,
      rectX + rectWidth / 2,
      rectY + this.PLAYER_NAME_RECT_HEIGHT / 2 - 0.5,
    );

    context.restore();
  }

  private renderDebugInformation(context: CanvasRenderingContext2D): void {
    DebugUtils.renderText(
      context,
      this.transform.x - this.transform.width / 2,
      this.transform.y + this.transform.height / 2 + 5,
      `X(${Math.round(this.transform.x)}) Y(${Math.round(this.transform.y)})`,
    );
  }

  // ── Smoke & Turbo ─────────────────────────────────────────────

  private spawnSmokeParticle(): void {
    const offset = this.transform.width / 2;
    const x = this.transform.x + Math.cos(this.transform.angle) * offset;
    const y = this.transform.y + Math.sin(this.transform.angle) * offset;
    const dir = this.transform.angle + Math.PI + (Math.random() - 0.5) * 0.4;
    const speed = 0.1 + Math.random() * 0.1;
    this.smokeParticles.push({
      x, y,
      size: 4 + Math.random() * 2,
      life: this.SMOKE_DURATION,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
    });
  }

  private updateSmokeParticles(delta: DOMHighResTimeStamp): void {
    const scale = delta / this.REFERENCE_DELTA;
    this.smokeParticles.forEach((p) => {
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.size += 0.03 * scale;
      p.life -= delta;
    });
    this.smokeParticles = this.smokeParticles.filter((p) => p.life > 0);
  }

  private renderSmokeTrail(context: CanvasRenderingContext2D): void {
    context.save();
    this.smokeParticles.forEach((p) => {
      const progress = Math.max(p.life / this.SMOKE_DURATION, 0);
      const shade = Math.floor(80 + (1 - progress) * 50);
      context.globalAlpha = 0.5 * progress;
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  private renderTurboEffect(context: CanvasRenderingContext2D): void {
    context.save();

    const length =
      this.TURBO_MIN_LENGTH +
      Math.random() * (this.TURBO_MAX_LENGTH - this.TURBO_MIN_LENGTH);
    const jitter = (Math.random() - 0.5) * 4;
    const gradient = context.createLinearGradient(
      this.transform.width / 2, 0,
      this.transform.width / 2 + length, 0,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.2, "#ffe066");
    gradient.addColorStop(1, "#ff5722");

    context.globalAlpha = 0.6 + Math.random() * 0.4;
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(this.transform.width / 2, 0);
    context.quadraticCurveTo(
      this.transform.width / 2 + length / 2 + jitter,
      -this.TURBO_WIDTH / 2,
      this.transform.width / 2 + length,
      0,
    );
    context.quadraticCurveTo(
      this.transform.width / 2 + length / 2 + jitter,
      this.TURBO_WIDTH / 2,
      this.transform.width / 2,
      0,
    );
    context.fill();

    context.restore();
  }
}
