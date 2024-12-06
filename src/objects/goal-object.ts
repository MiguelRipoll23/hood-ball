import { HitboxObject } from "./common/hitbox-object.js";
import { BaseStaticCollidableGameObject } from "./base/base-static-collidable-game-object.js";

export class GoalObject extends BaseStaticCollidableGameObject {
  private readonly WIDTH: number = 100; // Width of the goal
  private readonly HEIGHT: number = 40; // Height of the goal (adjusted)
  private readonly BORDER_SIZE: number = 2; // Border size
  private readonly BORDER_COLOR: string = "#fff";
  private readonly Y_OFFSET: number = 13;

  private fillColor: string = "rgba(255, 255, 255, 0.6)";

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.rigidBody = false;
    this.setPosition(canvas);
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.fillColor;
    context.strokeStyle = this.BORDER_COLOR;
    context.lineWidth = this.BORDER_SIZE;

    context.beginPath();
    context.rect(this.x, this.y, this.WIDTH, this.HEIGHT);
    context.closePath();
    context.fill();

    // Draw left border
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(this.x, this.y + this.HEIGHT);
    context.closePath();
    context.stroke();

    // Draw right border
    context.beginPath();
    context.moveTo(this.x + this.WIDTH, this.y);
    context.lineTo(this.x + this.WIDTH, this.y + this.HEIGHT);
    context.closePath();
    context.stroke();

    // Remove top border for orange team
    context.beginPath();
    context.moveTo(this.x, this.y + this.HEIGHT);
    context.lineTo(this.x + this.WIDTH, this.y + this.HEIGHT);
    context.closePath();
    context.stroke();

    // Hitbox
    super.render(context);
  }

  private setPosition(canvas: HTMLCanvasElement): void {
    this.y = this.Y_OFFSET;

    // Calculate x position to center the goal horizontally
    this.x = (canvas.width - this.WIDTH) / 2;
  }

  private createHitbox(): void {
    const y = this.y + 1;

    this.setHitboxObjects([
      new HitboxObject(this.x + 2, y, this.WIDTH - 4, this.HEIGHT / 2),
    ]);
  }
}
