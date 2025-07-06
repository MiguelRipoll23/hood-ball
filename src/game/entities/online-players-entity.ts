import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class OnlinePlayersEntity extends BaseAnimatedGameEntity {
  private onlinePlayers = 0;

  private getText(): string {
    return "ONLINE";
  }

  private baseX: number;
  private baseY: number;

  private shakeDuration = 0;
  private shakeElapsed = 0;
  private readonly shakeMagnitude = 2;

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
    this.shakeDuration = 300; // milliseconds
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
    const countText = this.onlinePlayers.toString();

    context.font = "bold 28px system-ui";
    context.textBaseline = "middle";
    context.textAlign = "left";

    const spacing = 10;
    const labelWidth = context.measureText(labelText).width;
    const countWidth = context.measureText(countText).width;
    const totalWidth = countWidth + spacing + labelWidth;

    const countX = this.x - totalWidth / 2;
    const labelX = countX + countWidth + spacing;

    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillText(countText, countX, this.y);

    context.fillStyle = "#ffffff";
    context.fillText(labelText, labelX, this.y);

    context.restore();
  }
}
