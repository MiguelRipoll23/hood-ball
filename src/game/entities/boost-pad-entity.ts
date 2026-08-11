import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { HitboxEntity } from "../../engine/entities/hitbox-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BoostPadScript } from "../scripts/boost-pad-script.js";
import type { EventProcessorService } from "../../engine/services/gameplay/event-processor-service.js";
import type { MatchSessionService } from "../services/session/match-session-service.js";

const PAD_RADIUS = 16;

export class BoostPadEntity extends BaseGameEntity {
  private readonly script: BoostPadScript;

  constructor(
    startX: number, startY: number,
    private readonly index: number,
    matchSessionService: MatchSessionService,
    eventProcessorService: EventProcessorService,
  ) {
    super();
    const t = this.addComponent(new TransformComponent());
    const phys = this.addComponent(new PhysicsComponent());
    this.addComponent(new CollisionComponent());
    phys.isDynamic = false; phys.rigidBody = false;
    t.x = startX; t.y = startY; t.width = PAD_RADIUS * 2; t.height = PAD_RADIUS * 2;

    this.script = new BoostPadScript(startX, startY, index, matchSessionService, eventProcessorService);
    this.addComponent(new ScriptComponent(this.script));
  }

  public override load(): void {
    const t = this.getComponent(TransformComponent)!;
    this.getComponent(CollisionComponent)!.hitboxEntities = [
      new HitboxEntity(t.x - t.width / 2, t.y - t.height / 2, t.width, t.height),
    ];
    super.load();
  }

  public override render(context: CanvasRenderingContext2D): void {
    this.script.globalAlpha = this.getOpacity();
    super.render(context);
  }

  public tryConsume(pid: string): boolean { return this.script.tryConsume(pid); }
  public forceConsume(): void { this.script.forceConsume(); }
  public reset(): void { this.script.reset(); }
  public getIndex(): number { return this.index; }
  public isActive(): boolean { return this.script.active; }
  public getX(): number { return this.getComponent(TransformComponent)!.x; }
  public getY(): number { return this.getComponent(TransformComponent)!.y; }
}
