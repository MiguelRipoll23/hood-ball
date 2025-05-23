import { BaseStaticCollidingGameObject } from "../base/base-static-colliding-game-object.js";
import { HitboxObject } from "../common/hitbox-object.js";
import type { GameObject } from "../../interfaces/object/game-object.js";

export class WorldBackgroundObject extends BaseStaticCollidingGameObject {
  private readonly BACKGROUND_COLOR: string = "#00a000";
  private readonly BOUNDARY_COLOR: string = "#ffffff";

  private fieldWidth: number = 0;
  private fieldHeight: number = 0;
  private fieldX: number = 0;
  private fieldY: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private radius: number = 50;

  private collisionObjects: GameObject[];

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.collisionObjects = [];
    this.calculateFieldDimensions();
    this.calculateCenter();
  }

  public override load(): void {
    this.createHitboxObjects();
    super.load();
  }

  private calculateFieldDimensions(): void {
    this.fieldWidth = this.canvas.width - 25;
    this.fieldHeight = this.canvas.height - 25;
    this.fieldX = (this.canvas.width - this.fieldWidth) / 2;
    this.fieldY = (this.canvas.height - this.fieldHeight) / 2;
  }

  private calculateCenter(): void {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Set background color
    context.fillStyle = this.BACKGROUND_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw football field
    context.fillStyle = this.BACKGROUND_COLOR;
    context.fillRect(
      this.fieldX,
      this.fieldY,
      this.fieldWidth,
      this.fieldHeight
    );

    // Draw boundary lines
    context.strokeStyle = this.BOUNDARY_COLOR;
    context.lineWidth = 2;
    context.strokeRect(
      this.fieldX,
      this.fieldY,
      this.fieldWidth,
      this.fieldHeight
    );

    // Draw midfield line
    context.beginPath();
    context.moveTo(this.fieldX, this.canvas.height / 2);
    context.lineTo(this.fieldX + this.fieldWidth, this.canvas.height / 2);
    context.stroke();

    // Draw center circle
    context.beginPath();
    context.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    context.stroke();

    // Draw hitboxes
    super.render(context);
  }

  public getCollisionHitboxes(): GameObject[] {
    return this.collisionObjects;
  }

  private createHitboxObjects() {
    this.setHitboxObjects([
      new HitboxObject(this.fieldX, this.fieldY, this.fieldWidth, 1),
      new HitboxObject(
        this.fieldX,
        this.canvas.height - this.fieldY,
        this.fieldWidth,
        1
      ),
      new HitboxObject(
        this.canvas.width - this.fieldX,
        this.fieldY,
        1,
        this.fieldHeight
      ),
      new HitboxObject(this.fieldX, this.fieldY, 1, this.fieldHeight),
    ]);
  }
}
