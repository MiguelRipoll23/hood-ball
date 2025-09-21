import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity.js";
import { EntityType } from "../enums/entity-type.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import type { ScoreboardUI } from "../interfaces/ui/scoreboard-ui.js";
import { BaseMultiplayerGameEntity } from "../../core/entities/base-multiplayer-entity.js";

export class ScoreboardEntity
  extends BaseMultiplayerGameEntity
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

  private x: number;
  private y: number = 90;

  private blueScore: number = 0;
  private redScore: number = 0;

  private active: boolean = false;
  private elapsedMilliseconds: number = 0;
  private flashElapsedMilliseconds: number = 0;
  private durationMilliseconds: number = 0;
  private remainingSeconds: number = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.x = this.canvas.width / 2 - this.SPACE_BETWEEN / 2;
    this.setSyncableValues();
  }

  public static getTypeId(): EntityType {
    return EntityType.Scoreboard;
  }

  public isActive(): boolean {
    return this.active;
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public setTimerDuration(durationSeconds: number): void {
    this.durationMilliseconds = durationSeconds * 1000;
  }

  public startTimer(): void {
    this.active = true;
  }

  public stopTimer(): void {
    this.active = false;
  }

  public getElapsedMilliseconds(): number {
    return this.elapsedMilliseconds;
  }

  public reset(): void {
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

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.active) {
      if (this.elapsedMilliseconds < this.durationMilliseconds) {
        this.elapsedMilliseconds += deltaTimeStamp;
      }
      this.flashElapsedMilliseconds += deltaTimeStamp;
    }

    this.remainingSeconds = Math.max(
      0,
      Math.ceil((this.durationMilliseconds - this.elapsedMilliseconds) / 1000)
    );
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    const totalWidth =
      2 * this.SQUARE_SIZE + this.SPACE_BETWEEN + this.TIME_BOX_WIDTH;
    const startX = this.x - totalWidth / 2;

    this.renderSquare(context, startX, this.BLUE_SHAPE_COLOR, this.blueScore);
    const formattedTime = this.formatTime(this.remainingSeconds);
    const timeX = startX + this.SQUARE_SIZE + this.SPACE_BETWEEN;
    const timeY = this.y + (this.SQUARE_SIZE - this.TIME_BOX_HEIGHT) / 2;
    this.renderTimeBox(
      context,
      timeX,
      timeY,
      this.TIME_BOX_WIDTH,
      this.TIME_BOX_HEIGHT,
      formattedTime
    );

    const redScoreX =
      startX +
      this.SQUARE_SIZE +
      this.SPACE_BETWEEN +
      this.TIME_BOX_WIDTH +
      this.SPACE_BETWEEN;
    this.renderSquare(context, redScoreX, this.RED_SHAPE_COLOR, this.redScore);

    context.restore();
  }

  private setSyncableValues() {
    this.setId("d4e5f6a78b9c0d1e2f3a4b5c6d7e8f9a");
    this.setTypeId(EntityType.Scoreboard);
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
      this.y,
      this.SQUARE_SIZE,
      this.SQUARE_SIZE,
      this.CORNER_RADIUS
    );
    context.fill();
    this.renderText(
      context,
      score.toString(),
      x + this.SQUARE_SIZE / 2,
      this.y + 12.5 + this.SQUARE_SIZE / 2
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

    const shouldFlash = (atZero && this.active) || (underFive && this.active);
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
    const useFlashingAlpha = shouldFlash && this.active;
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
