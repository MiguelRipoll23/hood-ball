import { BaseTappableGameEntity } from "../..//core/entities/base-tappable-game-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostButtonEntity extends BaseTappableGameEntity {
  private readonly RADIUS = 40;


  constructor(canvas: HTMLCanvasElement) {
    super();
    this.width = this.RADIUS * 2;
    this.height = this.RADIUS * 2;
    this.setPosition(canvas.width / 2, canvas.height - this.RADIUS - 20);
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
    const gradient = context.createRadialGradient(cx, cy, this.RADIUS / 4, cx, cy, this.RADIUS);
    gradient.addColorStop(0, '#ffe066');
    gradient.addColorStop(1, LIGHT_GREEN_COLOR);

    context.beginPath();
    context.arc(cx, cy, this.RADIUS, 0, Math.PI * 2);
    context.fillStyle = this.pressed ? 'rgba(100,100,100,0.8)' : gradient;
    context.fill();
    context.closePath();

    context.font = `${this.RADIUS * 1.2}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000';
    context.fillText('🚀', cx, cy + 2);

    context.restore();
    super.render(context);
  }
}
