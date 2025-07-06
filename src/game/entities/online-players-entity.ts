import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";

export class OnlinePlayersEntity extends BaseAnimatedGameEntity {
  // Display text that will be followed by a badge containing the number
  private readonly TEXT = "PLAYERS ONLINE";
  private onlinePlayers = 0;

  private baseX: number;
  private baseY: number;

  private shakeDuration = 0;
  private shakeElapsed = 0;
  private readonly shakeMagnitude = 4;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.baseX = this.canvas.width / 2;
    this.baseY = this.canvas.height - 40;
    this.x = this.baseX;
    this.y = this.baseY;
  }

  public setOnlinePlayers(total: number): void {
    if (this.onlinePlayers !== total) {
      this.onlinePlayers = total;
      this.startShake();
    } else {
      this.onlinePlayers = total;
    }
  }

  private startShake(): void {
    this.shakeDuration = 500; // milliseconds
    this.shakeElapsed = 0;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += deltaTimeStamp;
      const progress =
        (this.shakeDuration - this.shakeElapsed) / this.shakeDuration;
      const offsetX = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
      const offsetY = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
      this.x = this.baseX + offsetX;
      this.y = this.baseY + offsetY;
    } else {
      this.x = this.baseX;
      this.y = this.baseY;
    }

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    // Style for label text
    context.font = "bold 20px system-ui";
    context.fillStyle = "#ffffff";
    context.textBaseline = "middle";

    const textWidth = context.measureText(this.TEXT).width;
    const badgeRadius = 14;
    const spacing = 10;
    const totalWidth = textWidth + spacing + badgeRadius * 2;
    const startX = this.x - totalWidth / 2;

    // Draw the label text aligned to the left so we can position the badge
    context.textAlign = "left";
    context.fillText(this.TEXT, startX, this.y);

    const badgeX = startX + textWidth + spacing + badgeRadius;

    // Draw badge background with a subtle shadow
    context.shadowColor = "black";
    context.shadowBlur = 4;
    context.fillStyle = "#7ed321";
    context.beginPath();
    context.arc(badgeX, this.y, badgeRadius, 0, Math.PI * 2);
    context.fill();

    // Draw the number in the badge
    context.shadowBlur = 0;
    context.fillStyle = "#000000";
    context.font = "bold 16px system-ui";
    context.textAlign = "center";
    context.fillText(this.onlinePlayers.toString(), badgeX, this.y);

    context.restore();
  }
}
