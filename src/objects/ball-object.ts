import { HitboxObject } from "./common/hitbox-object.js";
import { BaseDynamicCollidableGameObject } from "./base/base-collidable-dynamic-game-object.js";
import { CarObject } from "./car-object.js";
import type { MultiplayerGameObject } from "../interfaces/object/multiplayer-game-object.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { ObjectType } from "../enums/object-type.js";
import { GamePlayer } from "../models/game-player.js";
import { ObjectUtils } from "../utils/object-utils.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class BallObject
  extends BaseDynamicCollidableGameObject
  implements MultiplayerGameObject
{
  private readonly MASS: number = 1;
  private readonly RADIUS: number = 20;
  private readonly FRICTION: number = 0.01;
  private readonly MIN_VELOCITY: number = 0.1;
  private readonly MAX_VELOCITY: number = 10;
  private readonly canvas: HTMLCanvasElement;

  private radius: number = this.RADIUS;
  protected width = this.RADIUS * 2;
  protected height = this.RADIUS * 2;

  private inactive: boolean = false;
  private lastPlayer: GamePlayer | null = null;

  constructor(x: number, y: number, canvas: HTMLCanvasElement) {
    super();
    this.x = x;
    this.y = y;
    this.mass = this.MASS;
    this.canvas = canvas;
    this.setSyncableValues();
  }

  public static override getTypeId(): ObjectType {
    return ObjectType.RemoteCar;
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  public override reset(): void {
    this.resetVelocityAndPosition();
    this.inactive = false;
    super.reset();
  }

  public setCenterPosition(): void {
    // Set position to the center of the canvas accounting for the radius
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
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

    ObjectUtils.fixObjectPositionIfOutOfBounds(this, this.canvas);
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

    if (this.debug) {
      this.renderDebugInformation(context);
    }

    // Hitbox render (from superclass)
    super.render(context);
  }

  public override sendSyncableData(
    webrtcPeer: WebRTCPeer,
    data: ArrayBuffer
  ): void {
    webrtcPeer.sendUnreliableOrderedMessage(data);
  }

  public override serialize(): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(8);
    const dataView = new DataView(arrayBuffer);

    dataView.setUint16(0, this.x);
    dataView.setUint16(2, this.y);
    dataView.setInt16(4, this.vx);
    dataView.setInt16(6, this.vy);

    return arrayBuffer;
  }

  public override synchronize(data: ArrayBuffer): void {
    const dataView = new DataView(data);

    this.x = dataView.getUint16(0);
    this.y = dataView.getUint16(2);
    this.vx = dataView.getInt16(4);
    this.vy = dataView.getInt16(6);

    this.updateHitbox();
  }

  private setSyncableValues() {
    this.setId("94c58aa0-41c3-4b22-825a-15a3834be240");
    this.setTypeId(ObjectType.Ball);
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
    const hitboxObject = new HitboxObject(
      this.x - this.RADIUS * 2,
      this.y - this.RADIUS * 2,
      this.RADIUS * 2,
      this.RADIUS * 2
    );

    this.setHitboxObjects([hitboxObject]);
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
    this.getHitboxObjects().forEach((object) => {
      object.setX(this.x - this.RADIUS);
      object.setY(this.y - this.RADIUS);
    });
  }

  private handlePlayerCollision(): void {
    this.getCollidingObjects().forEach((object) => {
      if (object instanceof CarObject) {
        this.lastPlayer = object.getPlayer();
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
