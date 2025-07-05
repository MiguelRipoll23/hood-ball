import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { TimerService } from "../../core/services/gameplay/timer-service.js";
import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import type { MultiplayerGameEntity } from "../../core/interfaces/entities/multiplayer-game-entity.js";

export class AlertEntity
  extends BaseAnimatedGameEntity
  implements MultiplayerGameEntity
{
  private textLines: string[] = ["Unknown", "message"];
  private color: string = "white";
  private fontSize: number = 44;

  private timer: TimerService | null = null;

  constructor(protected readonly canvas: HTMLCanvasElement) {
    super();
    this.setInitialValues();
  }

  public show(textLines: string[], color = "white", duration = 0): void {
    if (this.timer !== null) {
      this.timer.stop(false);
    }

    this.textLines = textLines;

    if (color === "blue") {
      this.color = BLUE_TEAM_COLOR;
    } else if (color === "red") {
      this.color = RED_TEAM_COLOR;
    } else {
      this.color = color;
    }

    if (textLines.length === 1) {
      this.fontSize = 74;
    } else {
      this.fontSize = 44;
    }

    this.fadeIn(0.3);
    this.scaleTo(1, 0.3);

    if (duration > 0) {
      this.timer = new TimerService(duration, this.hide.bind(this));
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
    this.applyOpacity(context);

    this.setTransformOrigin(context);
    this.setFontStyle(context);
    this.renderMultilineText(context);

    context.restore();
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
