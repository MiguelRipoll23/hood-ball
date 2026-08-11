import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { HitboxEntity } from "../../../engine/entities/hitbox-entity.js";
import type { GameEntity } from "../../../engine/models/game-entity.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../../engine/components/physics-component.js";
import { CollisionComponent } from "../../../engine/components/collision-component.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { WorldBackgroundScript } from "../../scripts/world-background-script.js";

export class WorldBackgroundEntity extends BaseGameEntity {
  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new TransformComponent());
    const phys = this.addComponent(new PhysicsComponent());
    this.addComponent(new CollisionComponent());
    phys.isDynamic = false;
    this.addComponent(new ScriptComponent(new WorldBackgroundScript(canvas)));
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
