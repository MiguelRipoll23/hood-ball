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
    this.resetVelocityAndPosition();
    this.inactive = false;
    this.setSkipInterpolation();
    super.reset();
  }

  public setCenterPosition(): void {
    // Set position to the center of the canvas accounting for the radius
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.setSkipInterpolation();
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

  public update(): void {
    this.applyFriction();
    this.calculateMovement();
    this.updateHitbox();
    this.handlePlayerCollision();

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
      .signedInt16(this.vx)
      .signedInt16(this.vy)
      .toArrayBuffer();

    return arrayBuffer;
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const newX = binaryReader.unsignedInt16();
    const newY = binaryReader.unsignedInt16();
    if (this.skipInterpolation) {
      this.x = newX;
      this.y = newY;
      this.skipInterpolation = false;
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

  private resetVelocityAndPosition(): void {
    this.vx = 0;
    this.vy = 0;
    this.setCenterPosition();
    super.reset();
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
