import { BaseTappableGameEntity } from "../..//core/entities/base-tappable-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostButtonEntity extends BaseTappableGameEntity {
  private readonly RADIUS = 32;
  private boostLevel = 1; // 0..1


  constructor(canvas: HTMLCanvasElement) {
    super();
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.setPosition(canvas.width / 2, canvas.height - this.RADIUS - 30);
  }

  public setBoostLevel(level: number): void {
    this.boostLevel = Math.max(0, Math.min(1, level));
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setPosition(x: number, y: number): void {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    this.applyOpacity(context);

    const cx = this.x + this.RADIUS;
    const cy = this.y + this.RADIUS;
    const gradient = context.createLinearGradient(
      0,
      this.y + this.height,
      0,
      this.y
    );
    gradient.addColorStop(0, '#ffe066');
    gradient.addColorStop(1, LIGHT_GREEN_COLOR);

    // base background when empty
    context.beginPath();
    context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = this.boostLevel === 0 ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,0,0.2)';
    context.fill();

    if (this.boostLevel > 0) {
      const fillHeight = this.height * this.boostLevel;
      context.save();
      context.beginPath();
      context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.fillStyle = gradient;
      context.fillRect(this.x, this.y + this.height - fillHeight, this.width, fillHeight);
      context.restore();
    }

    if (this.pressed) {
      context.beginPath();
      context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
      context.closePath();
      context.fillStyle = 'rgba(100,100,100,0.4)';
      context.fill();
    }

    context.font = `${this.RADIUS * 1.2}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000';
    context.fillText('🚀', cx, cy + 2);

    context.restore();
    super.render(context);
  }
}
