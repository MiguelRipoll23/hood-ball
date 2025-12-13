import { CarEntity } from "./car-entity.js";
import { BallEntity } from "./ball-entity.js";
import { GamePlayer } from "../models/game-player.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";
import { EntityUtils } from "../../engine/utils/entity-utils.js";

export class NpcCarEntity extends CarEntity {
  private readonly AI_UPDATE_INTERVAL = 50; // Update AI decisions every 50ms
  private readonly BOOST_DISTANCE_THRESHOLD = 200; // Distance to ball to activate boost
  private readonly BOOST_ANGLE_THRESHOLD = 0.5; // Max angle difference to use boost
  private readonly MIN_BOOST_THRESHOLD = 20; // Minimum boost required to activate
  private readonly ANGLE_TOLERANCE = 0.1; // Minimum angle difference to turn
  private readonly LOW_BOOST_THRESHOLD = 30; // Boost level below which to seek boost pads
  private readonly BOOST_PAD_SEEK_DISTANCE = 300; // Distance threshold to seek boost pads

  private aiUpdateTimer = 0;
  private targetAngle = 0;
  private active = false; // Control whether NPC AI is active
  private targetBoostPad: { x: number; y: number } | null = null;

  constructor(
    x: number,
    y: number,
    angle: number,
    canvas: HTMLCanvasElement,
    private readonly ballEntity: BallEntity,
    spawnPointIndex: number = -1
  ) {
    super(x, y, angle, true); // remote=true to use red car
    this.setCanvas(canvas);

    // Increase NPC speed to be competitive
    this.topSpeed = 0.5; // Increased from 0.4 for better long-distance movement
    this.acceleration = 0.004; // Increased from 0.003 for faster acceleration

    // Create a distinctive NPC player with robot emoji
    const npcPlayer = new GamePlayer(
      "npc-00000000-0000-0000-0000-000000000000",
      "🤖 NPC",
      false,
      0,
      spawnPointIndex
    );
    this.setOwner(npcPlayer);
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public isActive(): boolean {
    return this.active;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    // When inactive (during countdown), don't update anything - no movement, no AI, no boost
    if (!this.active) {
      return;
    }

    // Only update AI when active (after countdown)
    this.aiUpdateTimer += deltaTimeStamp;

    if (this.aiUpdateTimer >= this.AI_UPDATE_INTERVAL) {
      this.aiUpdateTimer = 0;
      this.updateAI(deltaTimeStamp);
    }

    // Call parent update for movement, boost, etc.
    super.update(deltaTimeStamp);

    // Ensure NPC stays within bounds (safety check)
    if (this.canvas) {
      EntityUtils.fixEntityPositionIfOutOfBounds(this, this.canvas);
    }
  }

  public setBoostPads(
    boostPads: Array<{ x: number; y: number; consumed: boolean }>
  ): void {
    // Store boost pad information for AI decision making
    this.boostPads = boostPads;
  }

  private boostPads: Array<{ x: number; y: number; consumed: boolean }> = [];

  private updateAI(deltaTimeStamp: DOMHighResTimeStamp): void {
    let targetX: number;
    let targetY: number;

    // Decide target: boost pad if low on boost, otherwise ball
    if (this.boost < this.LOW_BOOST_THRESHOLD) {
      const nearestBoostPad = this.findNearestAvailableBoostPad();
      if (nearestBoostPad) {
        targetX = nearestBoostPad.x;
        targetY = nearestBoostPad.y;
        this.targetBoostPad = nearestBoostPad;
      } else {
        // No boost pads available, go for ball
        targetX = this.ballEntity.getX();
        targetY = this.ballEntity.getY();
        this.targetBoostPad = null;
      }
    } else {
      // Boost is good, chase the ball
      targetX = this.ballEntity.getX();
      targetY = this.ballEntity.getY();
      this.targetBoostPad = null;
    }

    // Calculate direction to target
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    // Calculate angle to target
    // Note: The car's movement system uses x -= vx, y -= vy, so we need to invert the angle
    // to make the car move towards the target instead of away from it
    const angleTowardsTarget = Math.atan2(dy, dx) + Math.PI;

    this.targetAngle = angleTowardsTarget;

    // Smooth angle transition
    const angleDiff = this.normalizeAngle(this.targetAngle - this.angle);
    const turnAmount = this.HANDLING * deltaTimeStamp;

    if (Math.abs(angleDiff) > this.ANGLE_TOLERANCE) {
      if (angleDiff > 0) {
        this.angle += Math.min(turnAmount, angleDiff);
      } else {
        this.angle += Math.max(-turnAmount, angleDiff);
      }
    }

    // Always accelerate towards the target
    if (this.speed < this.topSpeed) {
      this.speed += this.acceleration * deltaTimeStamp;
    }

    // Use boost if close to ball and facing it (to push it harder)
    // Don't use boost when seeking boost pads
    if (
      !this.targetBoostPad &&
      distanceToTarget < this.BOOST_DISTANCE_THRESHOLD &&
      Math.abs(angleDiff) < this.BOOST_ANGLE_THRESHOLD &&
      this.boost > this.MIN_BOOST_THRESHOLD
    ) {
      this.activateBoost();
    } else {
      this.deactivateBoost();
    }
  }

  private findNearestAvailableBoostPad(): { x: number; y: number } | null {
    let nearestPad: { x: number; y: number } | null = null;
    let nearestDistanceSquared = Infinity;
    const seekDistanceSquared =
      this.BOOST_PAD_SEEK_DISTANCE * this.BOOST_PAD_SEEK_DISTANCE;

    for (const pad of this.boostPads) {
      if (!pad.consumed) {
        const dx = pad.x - this.x;
        const dy = pad.y - this.y;
        const distanceSquared = dx * dx + dy * dy;

        if (
          distanceSquared < nearestDistanceSquared &&
          distanceSquared < seekDistanceSquared
        ) {
          nearestDistanceSquared = distanceSquared;
          nearestPad = pad;
        }
      }
    }

    return nearestPad;
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  public override reset(): void {
    super.reset();
    this.aiUpdateTimer = 0;
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Call parent render first
    super.render(context);

    // Add NPC-specific debug info
    if (this.debugSettings?.isDebugging()) {
      this.renderNpcDebugInfo(context);
    }
  }

  private renderNpcDebugInfo(context: CanvasRenderingContext2D): void {
    // Determine current action with descriptive words
    let action = "Idle";
    if (this.active) {
      if (this.targetBoostPad) {
        action = "Seeking boost pad";
      } else {
        action = "Chasing ball";
      }
    }

    // Show action on one line (using 24px spacing like matchmaking service)
    DebugUtils.renderText(
      context,
      this.x - this.width / 2,
      this.y + this.height / 2 + 30,
      action
    );

    // Show boost level on a separate line below (24px spacing)
    const boostPercent = Math.round(this.boost);
    DebugUtils.renderText(
      context,
      this.x - this.width / 2,
      this.y + this.height / 2 + 54,
      `Boost: ${boostPercent}%`
    );
  }
}
