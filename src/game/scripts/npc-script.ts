import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";
import type { CarEntity } from "../entities/car-entity.js";
import type { BallEntity } from "../entities/ball-entity.js";

/**
 * NPC AI script. Runs before CarScript (priority -1) to set
 * speed/angle/boosting that CarScript will then consume.
 */
export class NpcScript implements ScriptLifecycle {
  // ── AI constants ──────────────────────────────────────────────
  private readonly AI_UPDATE_INTERVAL = 50;
  private readonly BOOST_DISTANCE_THRESHOLD = 200;
  private readonly BOOST_ANGLE_THRESHOLD = 0.5;
  private readonly MIN_BOOST_THRESHOLD = 20;
  private readonly ANGLE_TOLERANCE = 0.1;
  private readonly LOW_BOOST_THRESHOLD = 30;
  private readonly BOOST_PAD_SEEK_DISTANCE = 300;

  // ── References ────────────────────────────────────────────────
  private entity!: CarEntity;
  private ballEntity?: BallEntity;

  // ── State ─────────────────────────────────────────────────────
  inputActive = false;
  private aiUpdateTimer = 0;
  private targetAngle = 0;
  private targetBoostPad: { x: number; y: number } | null = null;
  private boostPads: Array<{ x: number; y: number; consumed: boolean }> = [];
  constructor(ballEntity?: BallEntity) {
    this.ballEntity = ballEntity;
  }

  resolveEntity(entity: CarEntity): void {
    this.entity = entity;
  }

  setBoostPads(pads: Array<{ x: number; y: number; consumed: boolean }>): void {
    this.boostPads = pads;
  }

  getTargetBoostPad(): { x: number; y: number } | null {
    return this.targetBoostPad;
  }

  reset(): void {
    this.aiUpdateTimer = 0;
  }

  // ── ScriptLifecycle ───────────────────────────────────────────

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.inputActive) return;

    // Skip AI during replay
    if (!this.ballEntity) return;

    this.aiUpdateTimer += deltaTimeStamp;
    if (this.aiUpdateTimer >= this.AI_UPDATE_INTERVAL) {
      this.aiUpdateTimer = 0;
      this.updateAI(deltaTimeStamp);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.entity.debugSettings?.isDebugging()) return;

    let action = "Idle";
    if (this.inputActive) {
      action = this.targetBoostPad ? "Seeking boost pad" : "Chasing ball";
    }

    DebugUtils.renderText(
      context,
      this.entity.getX() - this.entity.getWidth() / 2,
      this.entity.getY() + this.entity.getHeight() / 2 + 30,
      action,
    );

    DebugUtils.renderText(
      context,
      this.entity.getX() - this.entity.getWidth() / 2,
      this.entity.getY() + this.entity.getHeight() / 2 + 54,
      `Boost: ${Math.round(this.entity.getBoost())}%`,
    );
  }

  destroy(): void {
    // Nothing to clean up
  }

  // ── AI Logic ──────────────────────────────────────────────────

  private updateAI(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.ballEntity) return;

    let targetX: number;
    let targetY: number;

    if (this.entity.getBoost() < this.LOW_BOOST_THRESHOLD) {
      const nearestBoostPad = this.findNearestAvailableBoostPad();
      if (nearestBoostPad) {
        targetX = nearestBoostPad.x;
        targetY = nearestBoostPad.y;
        this.targetBoostPad = nearestBoostPad;
      } else {
        targetX = this.ballEntity.getX();
        targetY = this.ballEntity.getY();
        this.targetBoostPad = null;
      }
    } else {
      targetX = this.ballEntity.getX();
      targetY = this.ballEntity.getY();
      this.targetBoostPad = null;
    }

    const dx = targetX - this.entity.getX();
    const dy = targetY - this.entity.getY();
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    const angleTowardsTarget = Math.atan2(dy, dx) + Math.PI;
    this.targetAngle = angleTowardsTarget;

    const currentAngle = this.entity.getAngle();
    const angleDiff = this.normalizeAngle(this.targetAngle - currentAngle);
    const turnAmount = this.entity.getHandling() * deltaTimeStamp;

    if (Math.abs(angleDiff) > this.ANGLE_TOLERANCE) {
      if (angleDiff > 0) {
        this.entity.setAngle(currentAngle + Math.min(turnAmount, angleDiff));
      } else {
        this.entity.setAngle(currentAngle + Math.max(-turnAmount, angleDiff));
      }
    }

    // Always accelerate
    if (this.entity.getSpeed() < this.entity.getTopSpeed()) {
      this.entity.setSpeed(
        this.entity.getSpeed() + this.entity.getAcceleration() * deltaTimeStamp,
      );
    }

    // Boost logic
    if (
      !this.targetBoostPad &&
      distanceToTarget < this.BOOST_DISTANCE_THRESHOLD &&
      Math.abs(angleDiff) < this.BOOST_ANGLE_THRESHOLD &&
      this.entity.getBoost() > this.MIN_BOOST_THRESHOLD
    ) {
      this.entity.activateBoost();
    } else {
      this.entity.deactivateBoost();
    }
  }

  private findNearestAvailableBoostPad(): { x: number; y: number } | null {
    let nearestPad: { x: number; y: number } | null = null;
    let nearestDistanceSquared = Infinity;
    const seekDistanceSquared =
      this.BOOST_PAD_SEEK_DISTANCE * this.BOOST_PAD_SEEK_DISTANCE;

    for (const pad of this.boostPads) {
      if (!pad.consumed) {
        const dx = pad.x - this.entity.getX();
        const dy = pad.y - this.entity.getY();
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
}
