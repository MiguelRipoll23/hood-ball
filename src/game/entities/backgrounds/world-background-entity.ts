import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { HitboxEntity } from "../../../engine/entities/hitbox-entity.js";
import type { GameEntity } from "../../../engine/models/game-entity.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../../engine/components/physics-component.js";
import { CollisionComponent } from "../../../engine/components/collision-component.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";

export class WorldBackgroundEntity extends BaseGameEntity {
  private readonly BACKGROUND_COLOR = "#00a000";
  private readonly BOUNDARY_COLOR = "#ffffff";
  private readonly RADIUS = 50;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new TransformComponent());
    const phys = this.addComponent(new PhysicsComponent());
    this.addComponent(new CollisionComponent());
    phys.isDynamic = false;

    const fw = this.canvas.width - 25;
    const fh = this.canvas.height - 25;
    const fx = (this.canvas.width - fw) / 2;
    const fy = (this.canvas.height - fh) / 2;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const bg = this.BACKGROUND_COLOR;
    const bc = this.BOUNDARY_COLOR;
    const r = this.RADIUS;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.addComponent(new ScriptComponent({
      render: (ctx) => {
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch); ctx.fillRect(fx, fy, fw, fh);
        ctx.strokeStyle = bc; ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh);
        ctx.beginPath(); ctx.moveTo(fx, ch / 2); ctx.lineTo(fx + fw, ch / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
      },
    }));
  }

  public override load(): void {
    const fw = this.canvas.width - 25, fh = this.canvas.height - 25;
    const fx = (this.canvas.width - fw) / 2, fy = (this.canvas.height - fh) / 2;
    this.getComponent(CollisionComponent)!.hitboxEntities = [
      new HitboxEntity(fx, fy, fw, 1),
      new HitboxEntity(fx, this.canvas.height - fy, fw, 1),
      new HitboxEntity(this.canvas.width - fx, fy, 1, fh),
      new HitboxEntity(fx, fy, 1, fh),
    ];
    super.load();
  }

  public getCollisionHitboxes(): GameEntity[] {
    return this.getComponent(CollisionComponent)!.hitboxEntities as GameEntity[];
  }
}
