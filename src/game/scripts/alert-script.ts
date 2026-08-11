import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import { TimerService } from "../../engine/services/gameplay/timer-service.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";

/**
 * Script behaviour encapsulating the alert UI (show/hide, text rendering,
 * fade/scale animations, timer, and replay state).
 * Attached to AlertEntity via ScriptComponent.
 */
export class AlertScript implements ScriptLifecycle {
  textLines: string[] = ["Unknown", "message"];
  lineColors: string[] = [];
  private lineColorsHex: string[] = [];
  color = "white";
  fontSize = 44;

  private opacity = 0;

  private timer: TimerService | null = null;

  private transform!: TransformComponent;
  private animation!: AnimationComponent;
  private canvas!: HTMLCanvasElement;

  resolveComponents(
    canvas: HTMLCanvasElement,
    transform: TransformComponent,
    animation: AnimationComponent,
  ): void {
    this.canvas = canvas;
    this.transform = transform;
    this.animation = animation;
    this.setInitialValues();
  }

  getOpacity(): number {
    return this.opacity;
  }

  show(textLines: string[], color = "white", duration = 0): void {
    // Reset transform state before showing, so scale/position animations
    // start from a clean baseline.
    this.transform.scale = 0;
    this.transform.x = this.canvas.width / 2;
    this.transform.y = this.canvas.height / 2;

    this.showColored(
      textLines,
      textLines.map(() => color),
      duration,
    );
  }

  showColored(textLines: string[], colors: string[], duration = 0): void {
    if (textLines.length !== colors.length) {
      throw new Error(
        `AlertEntity.showColored: textLines length (${textLines.length}) does not match colors length (${colors.length})`,
      );
    }

    this.textLines = textLines;
    this.lineColors = colors;
    this.lineColorsHex = colors.map((c) => this.resolveColorToHex(c));
    this.color = this.lineColorsHex[0] ?? "#FFFFFF";
    this.fontSize = textLines.length === 1 ? 74 : 44;

    this.animation.fadeIn(0.3);
    this.animation.scaleTo(1, 0.3);

    if (duration > 0) {
      this.timer = this.getTimerService(duration);
    } else {
      this.timer?.stop(false);
      this.timer = null;
    }
  }

  hide(): void {
    if (this.opacity === 0) return;
    this.animation.fadeOut(0.3);
    this.animation.scaleTo(0, 0.3);
  }

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.timer?.update(deltaTimeStamp);
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.setTransformOrigin(context);
    this.setFontStyle(context);
    this.renderMultilineText(context);
    context.restore();
  }

  getReplayState(): ArrayBuffer | null {
    const writer = BinaryWriter.build();
    if (this.textLines.length > 255) {
      throw new RangeError(
        `AlertEntity: textLines.length (${this.textLines.length}) exceeds 255, cannot encode as unsignedInt8.`,
      );
    }
    writer.unsignedInt8(this.textLines.length);

    for (let i = 0; i < this.textLines.length; i++) {
      writer.variableLengthString(this.textLines[i] ?? "");
      writer.variableLengthString(this.lineColors[i] ?? "white");
    }

    writer.float32(this.opacity);
    writer.float32(this.transform.scale);
    writer.unsignedInt8(this.fontSize);

    return writer.toArrayBuffer();
  }

  applyReplayState(arrayBuffer: ArrayBuffer): void {
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
      this.transform.scale = reader.float32();
      this.fontSize = reader.unsignedInt8();
    } catch (err) {
      EngineLogger.error("AlertEntity", "AlertEntity: failed to apply replay state", err);
    }
  }

  private setInitialValues(): void {
    this.opacity = 0;
    this.transform.scale = 0;
    this.transform.x = this.canvas.width / 2;
    this.transform.y = this.canvas.height / 2;
  }

  private getTimerService(durationSeconds: number): TimerService {
    if (this.timer === null) {
      this.timer = new TimerService(durationSeconds, this.hide.bind(this));
    }
    this.timer.setDuration(durationSeconds);
    this.timer.start();
    return this.timer;
  }

  // Alias for animation system to read current opacity
  setOpacityFromEntity(v: number): void {
    this.opacity = v;
  }

  private setTransformOrigin(context: CanvasRenderingContext2D): void {
    context.translate(this.transform.x, this.transform.y);
    context.scale(this.transform.scale, this.transform.scale);
    context.translate(-this.transform.x, -this.transform.y);
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
    const startY =
      this.transform.y - blockHeight / 2 + lineHeight / 2;

    this.textLines.forEach((line, index) => {
      const yPosition = startY + index * lineHeight;
      context.fillStyle = this.lineColorsHex[index] ?? this.color;
      context.fillText(line, this.transform.x, yPosition);
    });
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
}
