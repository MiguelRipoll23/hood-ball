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

    const baseColor = colors[0] ?? "white";
    if (baseColor === "blue") {
      this.color = BLUE_TEAM_COLOR;
    } else if (baseColor === "red") {
      this.color = RED_TEAM_COLOR;
    } else {
      this.color = baseColor;
    }

    if (textLines.length === 1) {
      this.fontSize = 74;
    } else {
      this.fontSize = 44;
    }

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
    // Capture alert visual state for replay
    const writer = BinaryWriter.build();
    
    // Store number of text lines
    writer.unsignedInt8(this.textLines.length);
    
    // Store each text line and its color
    for (let i = 0; i < this.textLines.length; i++) {
      writer.variableLengthString(this.textLines[i] ?? "");
      writer.variableLengthString(this.lineColors[i] ?? "white");
    }
    
    // Store visual properties
    writer.float32(this.opacity);
    writer.float32(this.scale);
    writer.unsignedInt8(this.fontSize);
    
    return writer.toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    
    // Read number of text lines
    const lineCount = reader.unsignedInt8();
    
    // Read text lines and colors
    const textLines: string[] = [];
    const lineColors: string[] = [];
    
    for (let i = 0; i < lineCount; i++) {
      textLines.push(reader.variableLengthString());
      lineColors.push(reader.variableLengthString());
    }
    
    this.textLines = textLines;
    this.lineColors = lineColors;
    
    // Update base color from first line color
    const baseColor = lineColors[0] ?? "white";
    if (baseColor === "blue") {
      this.color = BLUE_TEAM_COLOR;
    } else if (baseColor === "red") {
      this.color = RED_TEAM_COLOR;
    } else {
      this.color = baseColor;
    }
    
    // Read and apply visual properties
    this.opacity = reader.float32();
    this.scale = reader.float32();
    this.fontSize = reader.unsignedInt8();
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

    // Adding black shadow to text for readability
    context.shadowColor = "black";
    context.shadowOffsetX = 0; // Horizontal offset of shadow
    context.shadowOffsetY = 0; // Vertical offset of shadow
    context.shadowBlur = 10; // Blur effect for the shadow
  }

  private renderMultilineText(context: CanvasRenderingContext2D): void {
    const lineHeight = this.fontSize;
    const blockHeight = this.textLines.length * lineHeight;
    const startY = this.y - blockHeight / 2 + lineHeight / 2; // Center the block

    this.textLines.forEach((line, index) => {
      const yPosition = startY + index * lineHeight;
      const color = this.resolveColor(this.lineColors[index] ?? this.color);
      context.fillStyle = color;
      this.drawText(context, line, this.x, yPosition);
    });
  }

  private drawText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    // Draw filled text with shadow applied
    context.fillText(text, x, y);
  }

  private resolveColor(color: string): string {
    if (color === "blue") {
      return BLUE_TEAM_COLOR;
    } else if (color === "red") {
      return RED_TEAM_COLOR;
    }
    return color;
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
