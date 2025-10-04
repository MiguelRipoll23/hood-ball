import { HitboxEntity } from "../../core/entities/hitbox-entity.js";
import { BaseDynamicCollidingGameEntity } from "../../core/entities/base-dynamic-colliding-game-entity.js";
import { CarEntity } from "./car-entity.js";
import type { MultiplayerGameEntity } from "../../core/interfaces/entities/multiplayer-game-entity.js";
import { EntityType } from "../enums/entity-type.js";
import { GamePlayer } from "../models/game-player.js";
import { EntityUtils } from "../../core/utils/entity-utils.js";
import { DebugUtils } from "../../core/utils/debug-utils.js";
import { BinaryWriter } from "../../core/utils/binary-writer-utils.js";
import { BinaryReader } from "../../core/utils/binary-reader-utils.js";
import { MathUtils } from "../../core/utils/math-utils.js";

export class BallEntity
  extends BaseDynamicCollidingGameEntity
  implements MultiplayerGameEntity
{
  private readonly MASS: number = 1;
  private readonly RADIUS: number = 20;
  private readonly FRICTION: number = 0.01;
  private readonly MIN_VELOCITY: number = 0.1;
  private readonly MAX_VELOCITY: number = 10;

  private radius: number = this.RADIUS;
  protected width = this.RADIUS * 2;
  protected height = this.RADIUS * 2;

  private inactive: boolean = false;
  private lastPlayer: GamePlayer | null = null;

  private fireballActive = false;
  private fireballTimer = 0;
  private fireTrailParticles: {
    x: number;
    y: number;
    size: number;
    life: number;
  }[] = [];
  private smokeParticles: {
    x: number;
    y: number;
    size: number;
    life: number;
  }[] = [];
  private readonly FIRE_TRAIL_DURATION = 300;
  private readonly SMOKE_DURATION = 600;

  private teleportFrameCount = 0; // Number of frames to skip interpolation after teleport
  private static readonly TELEPORT_SKIP_FRAMES = 3; // Skip interpolation for 3 frames after teleport

  constructor(
    x: number,
    y: number,
    private readonly canvas: HTMLCanvasElement
  ) {
    super();
    this.x = x;
    this.y = y;
    this.mass = this.MASS;
    this.setBounciness(0.8);
    this.setSyncableValues();
  }

  public static override getTypeId(): EntityType {
    return EntityType.Ball;
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  public override reset(): void {
    // Use teleport to reset to center position instead of manual reset
    this.teleport(this.canvas.width / 2, this.canvas.height / 2);
    this.inactive = false;
    super.reset();
  }

  public setCenterPosition(): void {
    // Set position to the center of the canvas accounting for the radius
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.setSkipInterpolation();
  }

  public override teleport(x: number, y: number, angle?: number): void {
    // Call parent teleport method (resets position and physics)
    super.teleport(x, y, angle);

    // Set frame count to skip interpolation for multiple frames
    this.teleportFrameCount = BallEntity.TELEPORT_SKIP_FRAMES;

    // No ball-specific state to reset currently
    this.updateHitbox();
  }

  public isInactive(): boolean {
    return this.inactive;
  }

  public handleGoalScored(): void {
    this.inactive = true;
    this.vx = -this.vx * 2;
    this.vy = -this.vy * 2;
  }

  public setInactive(inactive: boolean): void {
    this.inactive = inactive;
  }

  public getLastPlayer(): GamePlayer | null {
    return this.lastPlayer;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.applyFriction();
    this.calculateMovement();
    this.updateHitbox();
    this.handlePlayerCollision();

    if (this.fireballActive) {
      this.fireballTimer -= deltaTimeStamp;
      if (this.fireballTimer <= 0) {
        this.fireballActive = false;
        this.fireTrailParticles = [];
        this.smokeParticles = [];
      } else {
        this.updateFireballEffects(deltaTimeStamp);
      }
    }

    EntityUtils.fixEntityPositionIfOutOfBounds(this, this.canvas);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save(); // Save the current context state

    if (this.fireballActive) {
      this.drawFireball(context);
    } else {
      // Draw the gradient ball
      this.drawBallWithGradient(context);

      // If the ball is inactive, apply glow effect
      if (this.inactive) {
        this.applyGlowEffect(context);
        this.drawBallWithGlow(context);
      }
    }

    // Restore the context state
    context.restore();

    if (this.debugSettings?.isDebugging()) {
      this.renderDebugInformation(context);
    }

    // Hitbox render (from superclass)
    super.render(context);
  }

  public override serialize(): ArrayBuffer {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt16(this.x)
      .unsignedInt16(this.y)
      .signedInt16(this.vx)
      .signedInt16(this.vy)
      .toArrayBuffer();

    return arrayBuffer;
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const newX = binaryReader.unsignedInt16();
    const newY = binaryReader.unsignedInt16();

    // Check if we should skip interpolation (either due to setSkipInterpolation or teleport)
    const shouldSkipInterpolation =
      this.skipInterpolation || this.teleportFrameCount > 0;

    if (shouldSkipInterpolation) {
      this.x = newX;
      this.y = newY;
      this.skipInterpolation = false;

      // Decrement teleport frame count
      if (this.teleportFrameCount > 0) {
        this.teleportFrameCount--;
      }
    } else {
      this.x = MathUtils.lerp(this.x, newX, 0.5);
      this.y = MathUtils.lerp(this.y, newY, 0.5);
    }

    this.vx = binaryReader.signedInt16();
    this.vy = binaryReader.signedInt16();

    this.updateHitbox();
  }

  private setSyncableValues() {
    this.setId("94c58aa041c34b22825a15a3834be240");
    this.setTypeId(EntityType.Ball);
    this.setSyncableByHost(true);
  }

  // Function to create and draw the gradient ball
  private drawBallWithGradient(context: CanvasRenderingContext2D): void {
    const gradient = this.createGradient(context);
    context.beginPath();
    context.fillStyle = gradient;
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }

  // Function to create the radial gradient
  private createGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // Inner color (white)
    gradient.addColorStop(1, "rgba(200, 200, 200, 1)"); // Outer color (light gray)
    return gradient;
  }

  // Function to apply the glow effect when the ball is inactive
  private applyGlowEffect(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(255, 215, 0, 1)"; // Glow color (golden yellow)
    context.shadowBlur = 25; // Glow intensity
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  // Function to draw the ball with the glow effect
  private drawBallWithGlow(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }

  public activateFireball(durationSeconds = 5): void {
    this.fireballActive = true;
    this.fireballTimer = durationSeconds * 1000;
  }

  private drawFireball(context: CanvasRenderingContext2D): void {
    this.renderSmokeTrail(context);
    this.renderFireTrail(context);
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, "#ffffaa");
    gradient.addColorStop(0.5, "#ff8800");
    gradient.addColorStop(1, "#ff0000");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }

  private updateFireballEffects(delta: DOMHighResTimeStamp): void {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.MIN_VELOCITY) {
      const dirX = -this.vx / speed;
      const dirY = -this.vy / speed;
      const spawnX = this.x + dirX * this.radius;
      const spawnY = this.y + dirY * this.radius;

      this.fireTrailParticles.push({
        x: spawnX,
        y: spawnY,
        size: this.radius / 2,
        life: this.FIRE_TRAIL_DURATION,
      });

      this.smokeParticles.push({
        x: spawnX,
        y: spawnY,
        size: this.radius / 2,
        life: this.SMOKE_DURATION,
      });
    }

    this.fireTrailParticles.forEach((p) => {
      p.life -= delta;
      p.size *= 0.96;
    });
    this.fireTrailParticles = this.fireTrailParticles.filter((p) => p.life > 0);

    this.smokeParticles.forEach((p) => {
      p.life -= delta;
      p.size += 0.02 * (delta / 16);
      p.y -= 0.02 * (delta / 16);
    });
    this.smokeParticles = this.smokeParticles.filter((p) => p.life > 0);
  }

  private renderFireTrail(context: CanvasRenderingContext2D): void {
    context.save();
    this.fireTrailParticles.forEach((p) => {
      const progress = p.life / this.FIRE_TRAIL_DURATION;
      context.globalAlpha = progress;
      const gradient = context.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.size
      );
      gradient.addColorStop(0, "#ffffaa");
      gradient.addColorStop(1, "#ff0000");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  private renderSmokeTrail(context: CanvasRenderingContext2D): void {
    context.save();
    this.smokeParticles.forEach((p) => {
      const progress = p.life / this.SMOKE_DURATION;
      const shade = Math.floor(100 + 80 * progress);
      context.globalAlpha = 0.3 * progress;
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  private createHitbox(): void {
    const hitboxEntity = new HitboxEntity(
      this.x - this.RADIUS * 2,
      this.y - this.RADIUS * 2,
      this.RADIUS * 2,
      this.RADIUS * 2
    );

    this.setHitboxEntities([hitboxEntity]);
  }

  private applyFriction(): void {
    // Define a small threshold for near-zero velocity
    this.vx *= 1 - this.FRICTION;
    this.vy *= 1 - this.FRICTION;

    // If velocity is below the threshold, set it to zero
    if (Math.abs(this.vx) < this.MIN_VELOCITY) this.vx = 0;
    if (Math.abs(this.vy) < this.MIN_VELOCITY) this.vy = 0;

    this.limitVelocity(); // Apply the velocity limit after friction
  }

  private calculateMovement(): void {
    this.x -= this.vx;
    this.y -= this.vy;
  }

  private updateHitbox(): void {
    this.getHitboxEntities().forEach((entity) => {
      entity.setX(this.x - this.RADIUS);
      entity.setY(this.y - this.RADIUS);
    });
  }

  private handlePlayerCollision(): void {
    this.getCollidingEntities().forEach((entity) => {
      if (entity instanceof CarEntity) {
        this.lastPlayer = entity.getPlayer();
      }
    });
  }

  public override mustSync(): boolean {
    return this.vx !== 0 || this.vy !== 0;
  }

  // Function to limit velocity to the maximum speed
  private limitVelocity(): void {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.MAX_VELOCITY) {
      const scale = this.MAX_VELOCITY / speed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }

  private renderDebugInformation(context: CanvasRenderingContext2D): void {
    this.renderDebugPosition(context);
  }

  private renderDebugPosition(context: CanvasRenderingContext2D): void {
    DebugUtils.renderText(
      context,
      this.x - this.radius,
      this.y + this.radius + 5,
      `X(${Math.round(this.x)}) Y(${Math.round(this.y)})`
    );
  }
}
