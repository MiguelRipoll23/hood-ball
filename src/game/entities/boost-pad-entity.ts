import { BaseStaticCollidingGameEntity } from "../../core/entities/base-static-colliding-game-entity.js";
import { HitboxEntity } from "../../core/entities/hitbox-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";
import { BinaryWriter } from "../../core/utils/binary-writer-utils.js";
import { RemoteEvent } from "../../core/models/remote-event.js";
import { EventProcessorService } from "../../core/services/gameplay/event-processor-service.js";
import { GameState } from "../../core/models/game-state.js";
import { EventType } from "../enums/event-type.js";
import { container } from "../../core/services/di-container.js";

const PAD_COOLDOWN_MS = 15000;

export class BoostPadEntity extends BaseStaticCollidingGameEntity {
  private readonly RADIUS = 25;
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

  public tryConsume(): boolean {
    if (!this.active) {
      return false;
    }
    this.active = false;
    this.cooldownRemaining = PAD_COOLDOWN_MS;
    this.sendConsumeEvent();
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

    if (this.active) {
      const gradient = context.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.RADIUS
      );
      gradient.addColorStop(0, '#ffe066');
      gradient.addColorStop(1, LIGHT_GREEN_COLOR);
      const pulse = (Math.sin(this.glowTimer / 200) + 1) / 2;
      context.shadowColor = LIGHT_GREEN_COLOR;
      context.shadowBlur = 15 + pulse * 10;
      context.fillStyle = gradient;
    } else {
      const ratio = 1 - this.cooldownRemaining / PAD_COOLDOWN_MS;
      context.fillStyle = `rgba(100,100,100,${0.3 + 0.7 * ratio})`;
    }

    context.beginPath();
    context.arc(this.x, this.y, this.RADIUS, 0, Math.PI * 2);
    context.fill();
    context.closePath();
    context.restore();
    super.render(context);
  }

  private sendConsumeEvent(): void {
    const gameState = container.get(GameState);

    if (!gameState.getMatch()?.isHost()) {
      return;
    }

    const eventProcessor = container.get(EventProcessorService);
    const payload = BinaryWriter.build()
      .unsignedInt8(this.index)
      .toArrayBuffer();

    const event = new RemoteEvent(EventType.BoostPadConsumed);
    event.setData(payload);
    eventProcessor.sendEvent(event);
  }
}
