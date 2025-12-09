import { BaseStaticCollidingGameEntity } from "../../engine/entities/base-static-colliding-game-entity.ts";
import { HitboxEntity } from "../../engine/entities/hitbox-entity.ts";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.ts";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.ts";
import { RemoteEvent } from "../../engine/models/remote-event.ts";
import { EventProcessorService } from "../../engine/services/gameplay/event-processor-service.ts";
import { EventType } from "../../engine/enums/event-type.ts";
import { container } from "../../engine/services/di-container.ts";
import { MatchSessionService } from "../services/session/match-session-service.ts";

function colorWithAlpha(hex: string, alpha: number): string {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const PAD_COOLDOWN_MS = 10000;

export class BoostPadEntity extends BaseStaticCollidingGameEntity {
  private readonly RADIUS = 16;
  private active = true;
  private cooldownRemaining = 0;
  private glowTimer = 0;

  constructor(
    private startX: number,
    private startY: number,
    private readonly index: number
  ) {
    super();
    this.x = this.startX;
    this.y = this.startY;
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.rigidBody = false;
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.glowTimer += deltaTimeStamp;

    if (!this.active) {
      this.cooldownRemaining -= deltaTimeStamp;
      if (this.cooldownRemaining <= 0) {
        this.active = true;
        this.cooldownRemaining = 0;
      }
    }

    super.update(deltaTimeStamp);
  }

  private createHitbox(): void {
    const hitbox = new HitboxEntity(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    this.setHitboxEntities([hitbox]);
  }

  public tryConsume(playerId: string): boolean {
    if (!this.active) {
      return false;
    }
    this.active = false;
    this.cooldownRemaining = PAD_COOLDOWN_MS;
    this.sendConsumeEvent(playerId);
    return true;
  }

  public forceConsume(): void {
    this.active = false;
    this.cooldownRemaining = PAD_COOLDOWN_MS;
  }

  public reset(): void {
    this.active = true;
    this.cooldownRemaining = 0;
  }

  public getIndex(): number {
    return this.index;
  }

  public isActive(): boolean {
    return this.active;
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    if (this.active) {
      const pulse = (Math.sin(this.glowTimer / 200) + 1) / 2;
      const radius = this.RADIUS * (0.8 + 0.2 * pulse);
      const gradient = context.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        radius
      );
      gradient.addColorStop(0, "#ffe066");
      gradient.addColorStop(1, LIGHT_GREEN_COLOR);
      context.shadowColor = colorWithAlpha(
        LIGHT_GREEN_COLOR,
        context.globalAlpha
      );
      context.shadowBlur = 20 + pulse * 20;
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(this.x, this.y, radius, 0, Math.PI * 2);
      context.fill();
      context.closePath();
    } else {
      const ratio = 1 - this.cooldownRemaining / PAD_COOLDOWN_MS;
      const radius = this.RADIUS * 0.8;
      context.fillStyle = `rgba(100,100,100,${0.3 + 0.7 * ratio})`;
      context.beginPath();
      context.arc(this.x, this.y, radius, 0, Math.PI * 2);
      context.fill();
      context.closePath();
    }

    context.restore();
    super.render(context);
  }

  private sendConsumeEvent(playerId: string): void {
    const matchSessionService = container.get(MatchSessionService);

    if (!matchSessionService.getMatch()?.isHost()) {
      return;
    }

    const eventProcessor = container.get(EventProcessorService);
    const payload = BinaryWriter.build()
      .unsignedInt8(this.index)
      .fixedLengthString(playerId, 32)
      .toArrayBuffer();

    const event = new RemoteEvent(EventType.BoostPadConsumed);
    event.setData(payload);
    eventProcessor.sendEvent(event);
  }
}
