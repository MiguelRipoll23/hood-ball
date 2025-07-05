import { BaseTappableGameEntity } from "../../../core/entities/base-tappable-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";
import { AudioService } from "../../services/audio/audio-service.js";

export class AudioToggleEntity extends BaseTappableGameEntity {
  private readonly radius = 30;
  private readonly margin = 20;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly audioService: AudioService
  ) {
    super();
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.setPosition();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.pressed) {
      this.audioService.toggle();
    }
    this.setPosition();
    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    context.translate(this.x + this.radius, this.y + this.radius);

    context.beginPath();
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.closePath();

    if (this.audioService.isEnabled()) {
      context.fillStyle = LIGHT_GREEN_COLOR;
    } else {
      context.fillStyle = "rgba(0,0,0,0.5)";
    }
    context.strokeStyle = "#fff";
    context.lineWidth = 3;
    context.fill();
    context.stroke();

    this.drawSpeakerEmoji(context);

    context.restore();
    super.render(context);
  }

  private drawSpeakerEmoji(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#fff";
    context.font = `${this.radius}px serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const emoji = this.audioService.isEnabled() ? "\uD83D\uDD0A" : "\uD83D\uDD08";
    context.fillText(emoji, 0, 0);
  }

  private setPosition(): void {
    this.x = this.canvas.width / 2 - this.radius;
    this.y = this.canvas.height - this.radius * 2 - this.margin;
  }
}
