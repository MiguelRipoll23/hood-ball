import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import type { ScoreboardUI } from "../interfaces/ui/scoreboard-ui-interface.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";

/**
 * Script behaviour for the scoreboard HUD. Renders team score squares,
 * a countdown timer box with flash effects, and manages timer state.
 * Attached to ScoreboardEntity via ScriptComponent.
 */
export class ScoreboardScript implements ScriptLifecycle, ScoreboardUI {
  private readonly SQUARE_SIZE = 50;
  private readonly SPACE_BETWEEN = 10;
  private readonly TIME_BOX_WIDTH = 130;
  private readonly TIME_BOX_HEIGHT = 50;
  private readonly CORNER_RADIUS = 10;

  private readonly TEXT_COLOR = "white";
  private readonly FONT_SIZE = "36px";
  private readonly FONT_FAMILY = "monospace";

  private readonly BLUE_SHAPE_COLOR = BLUE_TEAM_COLOR;
  private readonly RED_SHAPE_COLOR = RED_TEAM_COLOR;
  private readonly TIME_BOX_FILL_COLOR = "#4caf50";
  private readonly FLASH_COLOR = "red";
  private readonly FADE_INTERVAL_MS = 500;

  _sx: number;
  _sy = 90;

  blueScore = 0;
  redScore = 0;

  _sactive = false;
  elapsedMilliseconds = 0;
  flashElapsedMilliseconds = 0;
  durationMilliseconds = 0;
  remainingSeconds = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._sx = canvas.width / 2 - this.SPACE_BETWEEN / 2;
  }

  update(dt: DOMHighResTimeStamp): void {
    if (this._sactive) {
      if (this.elapsedMilliseconds < this.durationMilliseconds) {
        this.elapsedMilliseconds += dt;
      }
      this.flashElapsedMilliseconds += dt;
    }
    this.remainingSeconds = Math.max(
      0,
      Math.ceil((this.durationMilliseconds - this.elapsedMilliseconds) / 1000),
    );
  }

  render(context: CanvasRenderingContext2D): void {
    const tw =
      2 * this.SQUARE_SIZE + this.SPACE_BETWEEN + this.TIME_BOX_WIDTH;
    const sx = this._sx - tw / 2;

    this.renderSquare(context, sx, this.BLUE_SHAPE_COLOR, this.blueScore);

    const ft = this.formatTime(this.remainingSeconds);
    const tx = sx + this.SQUARE_SIZE + this.SPACE_BETWEEN;
    const ty = this._sy + (this.SQUARE_SIZE - this.TIME_BOX_HEIGHT) / 2;
    this.renderTimeBox(
      context, tx, ty, this.TIME_BOX_WIDTH, this.TIME_BOX_HEIGHT, ft,
    );

    const rx =
      sx + this.SQUARE_SIZE + this.SPACE_BETWEEN + this.TIME_BOX_WIDTH + this.SPACE_BETWEEN;
    this.renderSquare(context, rx, this.RED_SHAPE_COLOR, this.redScore);
  }

  // ── ScoreboardUI implementation ────────────────────────────────

  setTimerDuration(durationSeconds: number): void {
    this.durationMilliseconds = durationSeconds * 1000;
  }

  startTimer(): void {
    this._sactive = true;
  }

  stopTimer(): void {
    this._sactive = false;
  }

  hasTimerFinished(): boolean {
    return this.elapsedMilliseconds >= this.durationMilliseconds;
  }

  incrementBlueScore(): void {
    this.blueScore++;
  }

  incrementRedScore(): void {
    this.redScore++;
  }

  setBlueScore(score: number): void {
    this.blueScore = score;
  }

  setRedScore(score: number): void {
    this.redScore = score;
  }

  reset(): void {
    this.elapsedMilliseconds = 0;
    this.flashElapsedMilliseconds = 0;
  }

  // ── Serialization helpers ─────────────────────────────────────

  serialize(): ArrayBuffer {
    return BinaryWriter.build()
      .unsignedInt16(this.elapsedMilliseconds)
      .toArrayBuffer();
  }

  synchronize(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.elapsedMilliseconds = reader.unsignedInt16();
  }

  getReplayState(): ArrayBuffer | null {
    return BinaryWriter.build()
      .unsignedInt8(this.blueScore)
      .unsignedInt8(this.redScore)
      .boolean(this._sactive)
      .unsignedInt32(this.durationMilliseconds)
      .unsignedInt32(this.elapsedMilliseconds)
      .toArrayBuffer();
  }

  applyReplayState(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.blueScore = reader.unsignedInt8();
    this.redScore = reader.unsignedInt8();
    this._sactive = reader.boolean();
    this.durationMilliseconds = reader.unsignedInt32();
    this.elapsedMilliseconds = reader.unsignedInt32();
    this.remainingSeconds = Math.max(
      0,
      Math.ceil((this.durationMilliseconds - this.elapsedMilliseconds) / 1000),
    );
  }

  // ── Private render helpers ────────────────────────────────────

  private renderSquare(
    ctx: CanvasRenderingContext2D,
    x: number,
    color: string,
    score: number,
  ): void {
    ctx.fillStyle = color;
    this.roundedRect(
      ctx, x, this._sy, this.SQUARE_SIZE, this.SQUARE_SIZE, this.CORNER_RADIUS,
    );
    ctx.fill();
    this.renderText(
      ctx,
      score.toString(),
      x + this.SQUARE_SIZE / 2,
      this._sy + 12.5 + this.SQUARE_SIZE / 2,
    );
  }

  private renderTimeBox(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, height: number,
    text: string,
  ): void {
    ctx.fillStyle = this.TIME_BOX_FILL_COLOR;
    this.roundedRect(ctx, x, y, width, height, this.CORNER_RADIUS);
    ctx.fill();

    const atZero = this.remainingSeconds <= 0;
    const underFive = this.remainingSeconds > 0 && this.remainingSeconds <= 5;

    const shouldFlash =
      (atZero && this._sactive) || (underFive && this._sactive);
    let alpha = 1;
    if (shouldFlash) {
      const interval = this.FADE_INTERVAL_MS;
      const cycle = (this.flashElapsedMilliseconds % interval) / interval;
      alpha = Math.abs(Math.sin(cycle * Math.PI));
    }

    ctx.save();
    const baseAlpha = ctx.globalAlpha;
    const useFlashingAlpha = shouldFlash && this._sactive;
    ctx.globalAlpha = baseAlpha * (useFlashingAlpha ? alpha : 1);
    const color = atZero || underFive ? this.FLASH_COLOR : this.TEXT_COLOR;
    this.renderText(ctx, text, x + width / 2, y + 12.5 + height / 2, color);
    ctx.restore();
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    color: string = this.TEXT_COLOR,
  ): void {
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = `${this.FONT_SIZE} ${this.FONT_FAMILY}`;
    ctx.fillText(text, x, y);
  }

  private formatTime(timeInSeconds: number): string {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}
