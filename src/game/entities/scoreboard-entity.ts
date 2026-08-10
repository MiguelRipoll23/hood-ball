import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import type { ScoreboardUI } from "../interfaces/ui/scoreboard-ui-interface.js";
import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";

export class ScoreboardEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity, ScoreboardUI
{
  private readonly SQUARE_SIZE: number = 50;
  private readonly SPACE_BETWEEN: number = 10;
  private readonly TIME_BOX_WIDTH: number = 130;
  private readonly TIME_BOX_HEIGHT: number = 50;
  private readonly CORNER_RADIUS: number = 10;

  private readonly TEXT_COLOR: string = "white";
  private readonly FONT_SIZE: string = "36px";
  private readonly FONT_FAMILY: string = "monospace";

  private readonly BLUE_SHAPE_COLOR: string = BLUE_TEAM_COLOR;
  private readonly RED_SHAPE_COLOR: string = RED_TEAM_COLOR;
  private readonly TIME_BOX_FILL_COLOR: string = "#4caf50"; // Added property for time box fill color
  private readonly FLASH_COLOR: string = "red";
  // Interval used for fade in/out effect when the timer is below 5 seconds
  private readonly FADE_INTERVAL_MS: number = 500;

  private _sx: number;
  private _sy: number = 90;

  private blueScore: number = 0;
  private redScore: number = 0;

  private _sactive: boolean = false;
  private elapsedMilliseconds: number = 0;
  private flashElapsedMilliseconds: number = 0;
  private durationMilliseconds: number = 0;
  private remainingSeconds: number = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new NetworkComponent());
    this._sx = this.canvas.width / 2 - this.SPACE_BETWEEN / 2;
    this.setSyncableValues();
    this.attachScript();
  }

  private attachScript(): void {
    const self = this;
    this.addComponent(new ScriptComponent({
      update: (dt) => { if (self._sactive) { if (self.elapsedMilliseconds < self.durationMilliseconds) { self.elapsedMilliseconds += dt; } self.flashElapsedMilliseconds += dt; } self.remainingSeconds = Math.max(0, Math.ceil((self.durationMilliseconds - self.elapsedMilliseconds) / 1000)); },
      render: (ctx) => { ctx.save(); self.applyOpacity(ctx); const tw = 2 * self["SQUARE_SIZE"] + self["SPACE_BETWEEN"] + self["TIME_BOX_WIDTH"]; const sx = self._sx - tw / 2; self["renderSquare"](ctx, sx, self["BLUE_SHAPE_COLOR"], self.blueScore); const ft = self["formatTime"](self.remainingSeconds); const tx = sx + self["SQUARE_SIZE"] + self["SPACE_BETWEEN"]; const ty = self._sy + (self["SQUARE_SIZE"] - self["TIME_BOX_HEIGHT"]) / 2; self["renderTimeBox"](ctx, tx, ty, self["TIME_BOX_WIDTH"], self["TIME_BOX_HEIGHT"], ft); const rx = sx + self["SQUARE_SIZE"] + self["SPACE_BETWEEN"] + self["TIME_BOX_WIDTH"] + self["SPACE_BETWEEN"]; self["renderSquare"](ctx, rx, self["RED_SHAPE_COLOR"], self.redScore); ctx.restore(); },
    }));
  }

  public static getTypeId(): EntityRegistryType {
    return EntityRegistryType.Scoreboard;
  }

  public isActive(): boolean {
    return this._sactive;
  }

  public setActive(active: boolean): void {
    this._sactive = active;
  }

  public setTimerDuration(durationSeconds: number): void {
    this.durationMilliseconds = durationSeconds * 1000;
  }

  public startTimer(): void {
    this._sactive = true;
  }

  public stopTimer(): void {
    this._sactive = false;
  }

  public getElapsedMilliseconds(): number {
    return this.elapsedMilliseconds;
  }

  public override reset(): void {
    super.reset();
    this.elapsedMilliseconds = 0;
    this.flashElapsedMilliseconds = 0;
  }

  public incrementBlueScore(): void {
    this.blueScore++;
  }

  public incrementRedScore(): void {
    this.redScore++;
  }

  public setBlueScore(score: number): void {
    this.blueScore = score;
  }

  public setRedScore(score: number): void {
    this.redScore = score;
  }

  public hasTimerFinished(): boolean {
    return this.elapsedMilliseconds >= this.durationMilliseconds;
  }

  public serialize(): ArrayBuffer {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt16(this.elapsedMilliseconds)
      .toArrayBuffer();

    return arrayBuffer;
  }

  public synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.elapsedMilliseconds = binaryReader.unsignedInt16();
  }

  public override getReplayState(): ArrayBuffer | null {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(this.blueScore)
      .unsignedInt8(this.redScore)
      .boolean(this._sactive)
      .unsignedInt32(this.durationMilliseconds)
      .unsignedInt32(this.elapsedMilliseconds)
      .toArrayBuffer();

    return arrayBuffer;
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.blueScore = binaryReader.unsignedInt8();
    this.redScore = binaryReader.unsignedInt8();
    this._sactive = binaryReader.boolean();
    this.durationMilliseconds = binaryReader.unsignedInt32();
    this.elapsedMilliseconds = binaryReader.unsignedInt32();

    // Recalculate remaining seconds based on elapsed and duration
    this.remainingSeconds = Math.max(
      0,
      Math.ceil((this.durationMilliseconds - this.elapsedMilliseconds) / 1000)
    );
  }


  private setSyncableValues() {
    this.setId("d4e5f6a78b9c0d1e2f3a4b5c6d7e8f9a");
    this.setTypeId(EntityRegistryType.Scoreboard);
    this.setSyncableByHost(true);
  }

  private renderSquare(
    context: CanvasRenderingContext2D,
    x: number,
    color: string,
    score: number
  ): void {
    context.fillStyle = color;
    this.roundedRect(
      context,
      x,
      this._sy,
      this.SQUARE_SIZE,
      this.SQUARE_SIZE,
      this.CORNER_RADIUS
    );
    context.fill();
    this.renderText(
      context,
      score.toString(),
      x + this.SQUARE_SIZE / 2,
      this._sy + 12.5 + this.SQUARE_SIZE / 2
    );
  }

  private renderTimeBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string
  ): void {
    context.fillStyle = this.TIME_BOX_FILL_COLOR;
    this.roundedRect(context, x, y, width, height, this.CORNER_RADIUS);
    context.fill();

    const atZero = this.remainingSeconds <= 0;
    const underFive = this.remainingSeconds > 0 && this.remainingSeconds <= 5;

    const shouldFlash = (atZero && this._sactive) || (underFive && this._sactive);
    let alpha = 1;
    if (shouldFlash) {
      // Use a consistent flash rate for low and zero time
      const interval = this.FADE_INTERVAL_MS;
      const cycle = (this.flashElapsedMilliseconds % interval) / interval;
      alpha = Math.abs(Math.sin(cycle * Math.PI));
    }

    context.save();
    const baseAlpha = context.globalAlpha;
    // When not active but time is low, show red color at full opacity
    const useFlashingAlpha = shouldFlash && this._sactive;
    context.globalAlpha = baseAlpha * (useFlashingAlpha ? alpha : 1);
    const color = atZero || underFive ? this.FLASH_COLOR : this.TEXT_COLOR;
    this.renderText(context, text, x + width / 2, y + 12.5 + height / 2, color);
    context.restore();
  }

  private roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  private renderText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string = this.TEXT_COLOR
  ) {
    context.textAlign = "center";
    context.fillStyle = color;
    context.font = `${this.FONT_SIZE} ${this.FONT_FAMILY}`;
    context.fillText(text, x, y);
  }

  private formatTime(timeInSeconds: number): string {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}
