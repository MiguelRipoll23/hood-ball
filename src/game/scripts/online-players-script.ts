import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

const SPACING = 10;
const ONLINE_TEXT = "ONLINE";

/**
 * Script behaviour for the online-players counter. Displays a count +
 * "ONLINE" label with shake animation on change and bounce animation
 * when appearing from zero.
 * Attached to OnlinePlayersEntity via ScriptComponent.
 */
export class OnlinePlayersScript implements ScriptLifecycle {
  onlinePlayers = 0;

  private baseX: number;
  private baseY: number;
  private transform!: TransformComponent;

  private labelWidth = 0;
  private countWidth = 0;

  private shakeDuration = 0;
  private shakeElapsed = 0;
  private readonly shakeMagnitude = 2;

  private bounceDuration = 0;
  private bounceElapsed = 0;
  private readonly bounceMagnitude = 20;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.baseX = canvas.width / 2;
    this.baseY = canvas.height - 40;
  }

  resolveComponents(transform: TransformComponent): void {
    this.transform = transform;
  }

  init(): void {
    this.transform.x = this.baseX;
    this.transform.y = this.baseY;

    const ctx = this.canvas.getContext("2d")!;
    ctx.font = "bold 28px system-ui";
    this.labelWidth = ctx.measureText(ONLINE_TEXT).width;
    this.countWidth = ctx.measureText(this.onlinePlayers.toString()).width;
  }

  measureCountWidth(): void {
    const ctx = this.canvas.getContext("2d")!;
    ctx.font = "bold 28px system-ui";
    this.countWidth = ctx.measureText(this.onlinePlayers.toString()).width;
  }

  startBounce(): void {
    this.bounceDuration = 600;
    this.bounceElapsed = 0;
  }

  startShake(): void {
    this.shakeDuration = 300;
    this.shakeElapsed = 0;
  }

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    let offsetX = 0;
    let offsetY = 0;

    if (this.bounceElapsed < this.bounceDuration) {
      this.bounceElapsed += deltaTimeStamp;
      const progress = this.bounceElapsed / this.bounceDuration;
      const bounceValue = Math.sin(progress * Math.PI * 2) * (1 - progress);
      offsetY = -bounceValue * this.bounceMagnitude;
    } else if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += deltaTimeStamp;
      const progress =
        (this.shakeDuration - this.shakeElapsed) / this.shakeDuration;
      offsetX = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
      offsetY = (Math.random() * 2 - 1) * this.shakeMagnitude * progress;
    }

    this.transform.x = this.baseX + offsetX;
    this.transform.y = this.baseY + offsetY;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    const countText = this.onlinePlayers.toString();

    context.font = "bold 28px system-ui";
    context.textBaseline = "middle";
    context.textAlign = "left";

    const totalWidth = this.countWidth + SPACING + this.labelWidth;
    const countX = this.transform.x - totalWidth / 2;
    const labelX = countX + this.countWidth + SPACING;

    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillText(countText, countX, this.transform.y);

    context.fillStyle = "#ffffff";
    context.fillText(ONLINE_TEXT, labelX, this.transform.y);

    context.restore();
  }
}
