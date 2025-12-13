import { BaseAnimatedGameEntity } from "../../engine/entities/base-animated-entity.js";
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

  private bounceDuration = 0;
  private bounceElapsed = 0;
  private readonly bounceMagnitude = 20;

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
    const previousTotal = this.onlinePlayers;
    this.onlinePlayers = total;

    // Ensure font is set before measuring text
    this.context.font = "bold 28px system-ui";
    this.countWidth = this.context.measureText(
      this.onlinePlayers.toString()
    ).width;

    // Handle visibility and animation
    if (previousTotal === 0 && total > 0) {
      // Fade in with bounce when going from 0 to more
      this.setOpacity(0);
      this.fadeIn(0.3);
      this.startBounce();
    } else if (total === 0) {
      // Hide immediately when reaching 0
      this.setOpacity(0);
    } else if (previousTotal !== total) {
      // Just shake if already visible and value changed
      this.startShake();
    }
  }

  private startShake(): void {
    this.shakeDuration = 300; // milliseconds
    this.shakeElapsed = 0;
  }

  private startBounce(): void {
    this.bounceDuration = 600; // milliseconds
    this.bounceElapsed = 0;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    let offsetX = 0;
    let offsetY = 0;

    // Handle bounce animation (takes priority)
    if (this.bounceElapsed < this.bounceDuration) {
      this.bounceElapsed += deltaTimeStamp;
      const progress = this.bounceElapsed / this.bounceDuration;
      // Ease-out bounce effect using sine wave
      const bounceValue = Math.sin(progress * Math.PI * 2) * (1 - progress);
      offsetY = -bounceValue * this.bounceMagnitude;
    }
    // Handle shake animation
    else if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += deltaTimeStamp;
      const progress =
        (this.shakeDuration - this.shakeElapsed) / this.shakeDuration;
      offsetX = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
      offsetY = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
    }

    this.x = this.baseX + offsetX;
    this.y = this.baseY + offsetY;

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
