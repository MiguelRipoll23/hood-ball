import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";
import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";

export class GoalEntity extends BaseGameEntity {
  private readonly WIDTH = 100;
  private readonly HEIGHT = 40;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new TransformComponent());
    const phys = this.addComponent(new PhysicsComponent());
    this.addComponent(new CollisionComponent());
    phys.isDynamic = false;
    phys.rigidBody = false;

    const t = this.getComponent(TransformComponent)!;
    t.width = this.WIDTH;
    t.height = this.HEIGHT;
    t.x = (canvas.width - this.WIDTH) / 2;
    t.y = 13;

    const borderColor = "#fff";
    const fillColor = "rgba(255, 255, 255, 0.6)";

    this.addComponent(new ScriptComponent({
      render: (ctx) => {
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.rect(t.x, t.y, this.WIDTH, this.HEIGHT); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x, t.y + this.HEIGHT); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t.x + this.WIDTH, t.y); ctx.lineTo(t.x + this.WIDTH, t.y + this.HEIGHT); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t.x, t.y + this.HEIGHT); ctx.lineTo(t.x + this.WIDTH, t.y + this.HEIGHT); ctx.closePath(); ctx.stroke();
      },
    }));
  }

  public override load(): void {
    const t = this.getComponent(TransformComponent)!;
    this.getComponent(CollisionComponent)!.hitboxEntities = [
      new HitboxEntity(t.x + 2, t.y + 1, this.WIDTH - 4, this.HEIGHT / 2),
    ];
    super.load();
  }
}
