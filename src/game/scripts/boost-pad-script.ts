import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { RemoteEvent } from "../../engine/models/remote-event.js";
import type { EventProcessorService } from "../../engine/services/gameplay/event-processor-service.js";
import { GameEventType } from "../enums/event-type.js";
import type { MatchSessionService } from "../services/session/match-session-service.js";

function colorWithAlpha(hex: string, alpha: number): string {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const PAD_COOLDOWN_MS = 10000;

export class BoostPadScript implements ScriptLifecycle {
  private readonly RADIUS = 16;
  active = true;
  private cooldownRemaining = 0;
  private glowTimer = 0;
  x: number;
  y: number;
  globalAlpha = 1;

  constructor(
    x: number,
    y: number,
    private readonly index: number,
    private readonly matchSessionService: MatchSessionService,
    private readonly eventProcessorService: EventProcessorService,
  ) {
    this.x = x;
    this.y = y;
  }

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.glowTimer += deltaTimeStamp;
    if (!this.active) {
      this.cooldownRemaining -= deltaTimeStamp;
      if (this.cooldownRemaining <= 0) {
        this.active = true;
        this.cooldownRemaining = 0;
      }
    }
  }

  tryConsume(playerId: string): boolean {
    if (!this.active) return false;
    this.active = false;
    this.cooldownRemaining = PAD_COOLDOWN_MS;
    this.sendConsumeEvent(playerId);
    return true;
  }

  forceConsume(): void {
    this.active = false;
    this.cooldownRemaining = PAD_COOLDOWN_MS;
  }

  reset(): void {
    this.active = true;
    this.cooldownRemaining = 0;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    if (this.globalAlpha < 1) context.globalAlpha = this.globalAlpha;

    if (this.active) {
      const pulse = (Math.sin(this.glowTimer / 200) + 1) / 2;
      const radius = this.RADIUS * (0.8 + 0.2 * pulse);
      const gradient = context.createRadialGradient(
        this.x, this.y, 0, this.x, this.y, radius,
      );
      gradient.addColorStop(0, "#ffe066");
      gradient.addColorStop(1, LIGHT_GREEN_COLOR);
      context.shadowColor = colorWithAlpha(LIGHT_GREEN_COLOR, context.globalAlpha);
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
  }

  private sendConsumeEvent(playerId: string): void {
    if (!this.matchSessionService.getMatch()?.isHost()) return;
    const payload = BinaryWriter.build()
      .unsignedInt8(this.index)
      .fixedLengthString(playerId, 32)
      .toArrayBuffer();
    const event = new RemoteEvent(GameEventType.BoostPadConsumed);
    event.setData(payload);
    this.eventProcessorService.sendEvent(event);
  }
}
