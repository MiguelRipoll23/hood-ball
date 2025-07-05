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
  private readonly SIZE = 40;
  private active = true;
  private cooldownRemaining = 0;

  constructor(
    private startX: number,
    private startY: number,
    private readonly index: number
  ) {
    super();
    this.x = this.startX;
    this.y = this.startY;
    this.width = this.SIZE;
    this.height = this.SIZE;
    this.rigidBody = false;
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
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
        this.width / 2
      );
      gradient.addColorStop(0, '#ffe066');
      gradient.addColorStop(1, LIGHT_GREEN_COLOR);
      context.fillStyle = gradient;
    } else {
      const ratio = 1 - this.cooldownRemaining / PAD_COOLDOWN_MS;
      context.fillStyle = `rgba(100,100,100,${0.3 + 0.7 * ratio})`;
    }
    context.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
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
