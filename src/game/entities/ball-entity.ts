import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";
import { BaseCollidingGameEntity } from "../../engine/entities/base-colliding-game-entity.js";
import { CarEntity } from "./car-entity.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { GamePlayer } from "../models/game-player.js";
import { EntityUtils } from "../../engine/utils/entity-utils.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { MathUtils } from "../../engine/utils/math-utils.js";
import { container } from "../../engine/services/di-container.js";
import { GameState } from "../../engine/models/game-state.js";
import { TELEPORT_SKIP_FRAMES, BALL_NETWORK_ID } from "../constants/entity-constants.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

export class BallEntity
  extends BaseCollidingGameEntity
  implements MultiplayerGameEntity
{
  private readonly MASS: number = 1;
  private readonly RADIUS: number = 20;
  private readonly FRICTION: number = 0.01;
  private readonly MIN_VELOCITY: number = 0.1;
  private readonly MAX_VELOCITY: number = 10;

  private radius: number = this.RADIUS;

  private inactive: boolean = false;
  private lastPlayer: GamePlayer | null = null;

  private teleportFrameCount = 0; // Number of frames to skip interpolation after teleport
  private weatherFrictionMultiplier = 1.0;

  constructor(
    x: number,
    y: number,
    private readonly canvas: HTMLCanvasElement
  ) {
    super();
    this.x = x;
    this.y = y;
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.physics.mass = this.MASS;
    this.physics.bounciness = 0.8;
    this.setSyncableValues();
  }

  public static override getTypeId(): EntityRegistryType {
    return EntityRegistryType.Ball;
  }

  public static override deserialize(
    id: string,
    arrayBuffer: ArrayBuffer
  ): MultiplayerGameEntity {
    // This is a special case since BallEntity needs a canvas reference in constructor
    // For synchronization, we don't usually create new balls from network data,
    // we sync the existing one. However, if needed (like late join), we need access to the canvas.
    // Since static methods don't have access to instance/scene context, we can't easily get the canvas.
    //
    // For Hood Ball, the ball is created by the scene (WorldScene) on load.
    // The createOrSynchronizeEntity method in EntityOrchestratorService attempts to find existing entity first.
    //
    // If we reach here, it means the system is trying to CREATE a new ball from network data,
    // which shouldn't happen for the main game ball as it's pre-created.
    //
    // However, to satisfy the interface and prevent crashes if it DOES happen (e.g. multi-ball mode in future),
    // we would need a way to get the canvas. For now, we'll return a ball with a dummy canvas
    // or throw a more descriptive error if we can't support dynamic ball creation yet.

    // Resolve canvas via DI rather than querying the DOM directly
    const canvas = container.get(GameState).getCanvas();

    const ball = new BallEntity(0, 0, canvas);
    ball.setId(id);
    ball.synchronize(arrayBuffer);
    return ball;
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
    this.teleportFrameCount = TELEPORT_SKIP_FRAMES;

    // No ball-specific state to reset currently
    this.updateHitbox();
  }

  public isInactive(): boolean {
    return this.inactive;
  }

  public handleGoalScored(): void {
    this.inactive = true;
    this.physics.vx = -this.physics.vx * 2;
    this.physics.vy = -this.physics.vy * 2;
  }

  public setInactive(inactive: boolean): void {
    this.inactive = inactive;
  }

  public getLastPlayer(): GamePlayer | null {
    return this.lastPlayer;
  }

  public clearLastPlayerIfMatches(player: GamePlayer): void {
    if (this.lastPlayer === player) {
      this.lastPlayer = null;
    }
  }

  public setWeatherFrictionMultiplier(multiplier: number): void {
    this.weatherFrictionMultiplier = multiplier;
  }

  public override update(_deltaTimeStamp: DOMHighResTimeStamp): void {
    this.applyFriction();
    this.calculateMovement();
    this.updateHitbox();
    this.handlePlayerCollision();

    // Update angle from velocity direction so the debug gizmo arrow
    // points the way the ball is actually moving.
    if (this.physics.vx !== 0 || this.physics.vy !== 0) {
      this.angle = Math.atan2(-this.physics.vy, -this.physics.vx);
    }

    EntityUtils.fixEntityPositionIfOutOfBounds(this, this.canvas);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save(); // Save the current context state

    // Draw the gradient ball
    this.drawBallWithGradient(context);

    // If the ball is inactive, apply glow effect
    if (this.inactive) {
      this.applyGlowEffect(context);
      this.drawBallWithGlow(context);
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
      .signedInt16(this.physics.vx)
      .signedInt16(this.physics.vy)
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

    this.physics.vx = binaryReader.signedInt16();
    this.physics.vy = binaryReader.signedInt16();

    this.updateHitbox();
  }

  public override getReplayState(): ArrayBuffer | null {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt16(this.x)
      .unsignedInt16(this.y)
      .signedInt16(this.physics.vx)
      .signedInt16(this.physics.vy)
      .toArrayBuffer();

    return arrayBuffer;
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    // Guard against empty or invalid buffers
    // Minimum size: 2 (uint16) * 2 + 2 (int16) * 2 = 8 bytes
    if (!arrayBuffer || arrayBuffer.byteLength < 8) {
      EngineLogger.warn("BallEntity", 
        `BallEntity: applyReplayState received invalid buffer size: ${
          arrayBuffer ? arrayBuffer.byteLength : 0
        }`
      );
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const newX = binaryReader.unsignedInt16();
    const newY = binaryReader.unsignedInt16();

    this.x = newX;
    this.y = newY;
    this.physics.vx = binaryReader.signedInt16();
    this.physics.vy = binaryReader.signedInt16();

    this.updateHitbox();
  }

  private setSyncableValues() {
    this.setSyncable(true);
    this.setId(BALL_NETWORK_ID);
    this.setTypeId(EntityRegistryType.Ball);
    this.setSyncableByHost(true);
  }

  // Draw the ball with a radial gradient for a 3D soccer-ball look.
  private drawBallWithGradient(context: CanvasRenderingContext2D): void {
    const gradient = context.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, "rgba(200, 200, 200, 1)");

    context.beginPath();
    context.fillStyle = gradient;
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
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
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
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
    // Apply weather-modified friction
    const effectiveFriction = this.FRICTION * this.weatherFrictionMultiplier;
    this.physics.vx *= 1 - effectiveFriction;
    this.physics.vy *= 1 - effectiveFriction;

    // If velocity is below the threshold, set it to zero
    if (Math.abs(this.physics.vx) < this.MIN_VELOCITY) this.physics.vx = 0;
    if (Math.abs(this.physics.vy) < this.MIN_VELOCITY) this.physics.vy = 0;

    this.limitVelocity(); // Apply the velocity limit after friction
  }

  private calculateMovement(): void {
    this.x -= this.physics.vx;
    this.y -= this.physics.vy;
  }

  public updateHitbox(): void {
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
    return this.physics.vx !== 0 || this.physics.vy !== 0;
  }

  // Function to limit velocity to the maximum speed
  private limitVelocity(): void {
    const speed = Math.sqrt(this.physics.vx * this.physics.vx + this.physics.vy * this.physics.vy);
    if (speed > this.MAX_VELOCITY) {
      const scale = this.MAX_VELOCITY / speed;
      this.physics.vx *= scale;
      this.physics.vy *= scale;
    }
  }

  public getTrajectoryPoints(steps = 60): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const effectiveFriction = this.FRICTION * this.weatherFrictionMultiplier;
    let px = this.x;
    let py = this.y;
    let vx = this.physics.vx;
    let vy = this.physics.vy;

    for (let i = 0; i < steps; i++) {
      vx *= 1 - effectiveFriction;
      vy *= 1 - effectiveFriction;

      if (Math.abs(vx) < this.MIN_VELOCITY) vx = 0;
      if (Math.abs(vy) < this.MIN_VELOCITY) vy = 0;

      if (vx === 0 && vy === 0) break;

      px -= vx;
      py -= vy;
      points.push({ x: px, y: py });
    }

    return points;
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
