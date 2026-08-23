import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { GoalScript } from "../scripts/goal-script.js";

/**
 * Pure component container for the goal. All rendering and hitbox logic
 * lives in {@link GoalScript}.
 */
export class GoalEntity extends BaseGameEntity {
  private readonly script: GoalScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const transform = this.addComponent(new TransformComponent());
    const phys = this.addComponent(new PhysicsComponent());
    const collision = this.addComponent(new CollisionComponent());
    phys.isDynamic = false;
    phys.rigidBody = false;

    this.script = new GoalScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, collision);
    this.script.init(canvas);
  }

  public override load(): void {
    this.script.createHitbox();
    super.load();
  }

  public getX(): number { return this.getComponent(TransformComponent)!.x; }
  public getY(): number { return this.getComponent(TransformComponent)!.y; }
  public getWidth(): number { return this.getComponent(TransformComponent)!.width; }
  public getHeight(): number { return this.getComponent(TransformComponent)!.height; }
  public getCollidingEntities(): BaseGameEntity[] {
    return (this.getComponent(CollisionComponent)?.collidingEntities as unknown as BaseGameEntity[]) ?? [];
  }
}
