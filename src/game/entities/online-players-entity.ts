import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";

export class OnlinePlayersEntity extends BaseAnimatedGameEntity {
  private onlinePlayers = 0;

  private getText(): string {
    return "ONLINE PLAYERS";
  }

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

    const labelText = this.getText();

    // Style for label text
    context.font = "bold 20px system-ui";
    context.fillStyle = "#ffffff";
    context.textBaseline = "middle";
    context.textAlign = "left";

    const badgeRadius = 14;
    const spacing = 10;

    const textWidth = context.measureText(labelText).width;
    const totalWidth = textWidth + spacing + badgeRadius * 2;

    const textX = this.x - totalWidth / 2;
    const badgeX = textX + textWidth + spacing + badgeRadius;
    const badgeY = this.y;

    // Draw the label text with the badge horizontally aligned
    context.fillText(labelText, textX, this.y);

    // Draw badge background
    context.fillStyle = "#7ed321";
    context.beginPath();
    context.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    context.fill();

    // Draw the number in the badge
    context.fillStyle = "#ffffff";
    context.font = "bold 16px system-ui";
    context.textAlign = "center";
    context.fillText(this.onlinePlayers.toString(), badgeX, badgeY);

    context.restore();
  }
}
