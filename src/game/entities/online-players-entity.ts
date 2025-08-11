import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class OnlinePlayersEntity extends BaseAnimatedGameEntity {
  private static readonly SPACING = 10;
  private static readonly ONLINE_TEXT = "ONLINE";
  private onlinePlayers = 0;

  private baseX: number;
  private baseY: number;
  private context: CanvasRenderingContext2D;
  private labelWidth = 0;
  private countWidth = 0;

  private shakeDuration = 0;
  private shakeElapsed = 0;
  private readonly shakeMagnitude = 2;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.baseX = this.canvas.width / 2;
    this.baseY = this.canvas.height - 40;
    this.x = this.baseX;
    this.y = this.baseY;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    // Ensure font is properly set before measuring text
    this.context.font = "bold 28px system-ui";
    this.labelWidth = this.context.measureText(
      OnlinePlayersEntity.ONLINE_TEXT
    ).width;
    this.countWidth = this.context.measureText(
      this.onlinePlayers.toString()
    ).width;
  }

  public setOnlinePlayers(total: number): void {
    if (this.onlinePlayers !== total) {
      this.onlinePlayers = total;
      this.startShake();
      // Ensure font is set before measuring text
      this.context.font = "bold 28px system-ui";
      this.countWidth = this.context.measureText(
        this.onlinePlayers.toString()
      ).width;
    } else {
      this.onlinePlayers = total;
      // Ensure font is set before measuring text
      this.context.font = "bold 28px system-ui";
      this.countWidth = this.context.measureText(
        this.onlinePlayers.toString()
      ).width;
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

    const labelText = OnlinePlayersEntity.ONLINE_TEXT;
    const countText = this.onlinePlayers.toString();

    context.font = "bold 28px system-ui";
    context.textBaseline = "middle";
    context.textAlign = "left";

    const totalWidth =
      this.countWidth + OnlinePlayersEntity.SPACING + this.labelWidth;

    const countX = this.x - totalWidth / 2;
    const labelX = countX + this.countWidth + OnlinePlayersEntity.SPACING;

    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillText(countText, countX, this.y);

    context.fillStyle = "#ffffff";
    context.fillText(labelText, labelX, this.y);

    context.restore();
  }
}
