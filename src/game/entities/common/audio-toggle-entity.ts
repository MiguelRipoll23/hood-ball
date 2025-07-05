import { BaseTappableGameEntity } from "../../../core/entities/base-tappable-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../../constants/colors-constants.js";
import { AudioService } from "../../services/audio/audio-service.js";

export class AudioToggleEntity extends BaseTappableGameEntity {
  private radius = 30;

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
      context.fillStyle = "rgba(0,0,0,0)";
    }
    context.strokeStyle = "#fff";
    context.lineWidth = 3;
    context.fill();
    context.stroke();

    this.drawSpeakerIcon(context);

    context.restore();
    super.render(context);
  }

  private drawSpeakerIcon(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#fff";
    context.beginPath();
    context.moveTo(-12, -10);
    context.lineTo(-2, -10);
    context.lineTo(8, -18);
    context.lineTo(8, 18);
    context.lineTo(-2, 10);
    context.lineTo(-12, 10);
    context.closePath();
    context.fill();

    if (this.audioService.isEnabled()) {
      context.strokeStyle = "#fff";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(12, 0, 10, -Math.PI / 4, Math.PI / 4);
      context.stroke();
      context.beginPath();
      context.arc(12, 0, 16, -Math.PI / 4, Math.PI / 4);
      context.stroke();
    }
  }

  private setPosition(): void {
    this.x = this.canvas.width / 2 - this.radius;
    this.y = this.canvas.height - this.radius * 2 - 20;
  }
}
