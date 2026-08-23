import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { CollisionComponent } from "../../engine/components/collision-component.js";
import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";

/**
 * Script behaviour encapsulating the goal's rendering and hitbox setup.
 * Attached to GoalEntity via ScriptComponent.
 */
export class GoalScript implements ScriptLifecycle {
  readonly WIDTH = 100;
  readonly HEIGHT = 40;

  private transform!: TransformComponent;
  private collision!: CollisionComponent;

  resolveComponents(
    transform: TransformComponent,
    collision: CollisionComponent,
  ): void {
    this.transform = transform;
    this.collision = collision;
  }

  init(canvas: HTMLCanvasElement): void {
    this.transform.width = this.WIDTH;
    this.transform.height = this.HEIGHT;
    this.transform.x = (canvas.width - this.WIDTH) / 2;
    this.transform.y = 13;
  }

  createHitbox(): void {
    this.collision.hitboxEntities = [
      new HitboxEntity(
        this.transform.x + 2,
        this.transform.y + 1,
        this.WIDTH - 4,
        this.HEIGHT / 2,
      ),
    ];
  }

  render(context: CanvasRenderingContext2D): void {
    const t = this.transform;
    context.fillStyle = "rgba(255, 255, 255, 0.6)";
    context.strokeStyle = "#fff";
    context.lineWidth = 2;

    context.beginPath();
    context.rect(t.x, t.y, this.WIDTH, this.HEIGHT);
    context.closePath();
    context.fill();

    // Left edge
    context.beginPath();
    context.moveTo(t.x, t.y);
    context.lineTo(t.x, t.y + this.HEIGHT);
    context.closePath();
    context.stroke();

    // Right edge
    context.beginPath();
    context.moveTo(t.x + this.WIDTH, t.y);
    context.lineTo(t.x + this.WIDTH, t.y + this.HEIGHT);
    context.closePath();
    context.stroke();

    // Bottom edge
    context.beginPath();
    context.moveTo(t.x, t.y + this.HEIGHT);
    context.lineTo(t.x + this.WIDTH, t.y + this.HEIGHT);
    context.closePath();
    context.stroke();
  }
}
