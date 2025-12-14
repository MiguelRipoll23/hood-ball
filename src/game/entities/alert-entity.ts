import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { TimerService } from "../../engine/services/gameplay/timer-service.js";
import { BaseAnimatedGameEntity } from "../../engine/entities/base-animated-entity.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";

export class AlertEntity
  extends BaseAnimatedGameEntity
  implements MultiplayerGameEntity
{
  private textLines: string[] = ["Unknown", "message"];
  private lineColors: string[] = [];
  private lineColorsHex: string[] = [];
  private color: string = "white";
  private fontSize: number = 44;

  private timer: TimerService | null = null;

  constructor(protected readonly canvas: HTMLCanvasElement) {
    super();
    this.setInitialValues();
  }

  public show(textLines: string[], color = "white", duration = 0): void {
    this.reset();
    this.showColored(
      textLines,
      textLines.map(() => color),
      duration
    );
  }

  public showColored(
    textLines: string[],
    colors: string[],
    duration = 0
  ): void {
    if (textLines.length !== colors.length) {
      throw new Error(
        `AlertEntity.showColored: textLines length (${textLines.length}) does not match colors length (${colors.length})`
      );
    }

    this.textLines = textLines;
    this.lineColors = colors;

    // Resolve hex colors once
    this.lineColorsHex = colors.map((c) => this.resolveColorToHex(c));
    this.color = this.lineColorsHex[0] ?? "#FFFFFF";

    this.fontSize = textLines.length === 1 ? 74 : 44;

    this.fadeIn(0.3);
    this.scaleTo(1, 0.3);

    if (duration > 0) {
      this.timer = this.getTimerService(duration);
    }
  }

  public hide(): void {
    this.fadeOut(0.3);
    this.scaleTo(0, 0.3);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.timer?.update(deltaTimeStamp);
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    this.setTransformOrigin(context);
    this.setFontStyle(context);
    this.renderMultilineText(context);

    context.restore();
  }

  private getTimerService(durationSeconds: number): TimerService {
    if (this.timer === null) {
      this.timer = new TimerService(durationSeconds, this.hide.bind(this));
    }

    this.timer.setDuration(durationSeconds);
    this.timer.start();

    return this.timer;
  }

  public override getReplayState(): ArrayBuffer | null {
    const writer = BinaryWriter.build();
    writer.unsignedInt8(this.textLines.length);

    for (let i = 0; i < this.textLines.length; i++) {
      writer.variableLengthString(this.textLines[i] ?? "");
      // Store color as string (supports both named colors and hex values)
      writer.variableLengthString(this.lineColors[i] ?? "white");
    }

    writer.float32(this.opacity);
    writer.float32(this.scale);
    writer.unsignedInt8(this.fontSize);

    return writer.toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    if (!arrayBuffer || arrayBuffer.byteLength < 6) return;

    try {
      const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
      const lineCount = reader.unsignedInt8();

      const textLines: string[] = [];
      const lineColors: string[] = [];
      const lineColorsHex: string[] = [];

      for (let i = 0; i < lineCount; i++) {
        const text = reader.variableLengthString();
        const colorStr = reader.variableLengthString();

        textLines.push(text);
        lineColors.push(colorStr);
        lineColorsHex.push(this.resolveColorToHex(colorStr));
      }

      this.textLines = textLines;
      this.lineColors = lineColors;
      this.lineColorsHex = lineColorsHex;
      this.color = this.lineColorsHex[0] ?? "#FFFFFF";

      this.opacity = reader.float32();
      this.scale = reader.float32();
      this.fontSize = reader.unsignedInt8();
    } catch (err) {
      console.error("AlertEntity: failed to apply replay state", err);
    }
  }

  private setTransformOrigin(context: CanvasRenderingContext2D): void {
    context.translate(this.x, this.y);
    context.scale(this.scale, this.scale);
    context.translate(-this.x, -this.y);
  }

  private setFontStyle(context: CanvasRenderingContext2D): void {
    context.font = `${this.fontSize}px system-ui`;
    context.fillStyle = this.color;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.shadowColor = "black";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 10;
  }

  private renderMultilineText(context: CanvasRenderingContext2D): void {
    const lineHeight = this.fontSize;
    const blockHeight = this.textLines.length * lineHeight;
    const startY = this.y - blockHeight / 2 + lineHeight / 2;

    this.textLines.forEach((line, index) => {
      const yPosition = startY + index * lineHeight;
      context.fillStyle = this.lineColorsHex[index] ?? this.color;
      this.drawText(context, line, this.x, yPosition);
    });
  }

  private drawText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    context.fillText(text, x, y);
  }

  private resolveColorToHex(color: string): string {
    if (!color) return "#FFFFFF";

    switch (color.toLowerCase()) {
      case "red":
        return RED_TEAM_COLOR;
      case "blue":
        return BLUE_TEAM_COLOR;
      case "white":
        return "#FFFFFF";
      default:
        return /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#FFFFFF";
    }
  }

  private setInitialValues() {
    this.opacity = 0;
    this.scale = 0;
    this.setCenterPosition();
  }

  private setCenterPosition(): void {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
  }
}
