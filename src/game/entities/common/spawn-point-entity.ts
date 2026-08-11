import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import type { MatchSessionService } from "../../services/session/match-session-service.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { SpawnPointScript } from "../../scripts/spawn-point-script.js";

export class SpawnPointEntity extends BaseGameEntity {
  private readonly script: SpawnPointScript;

  constructor(index: number, x: number, y: number) {
    super();
    const transform = this.addComponent(new TransformComponent());
    transform.x = x; transform.y = y; transform.width = 24; transform.height = 24;

    this.script = new SpawnPointScript(index);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveTransform(transform);
    this.script.resolveEntity(this);
  }

  public getIndex(): number { return this.script.getIndex(); }
  public getX(): number { return this.getComponent(TransformComponent)!.x; }
  public getY(): number { return this.getComponent(TransformComponent)!.y; }
  public setMatchSessionService(s: MatchSessionService): void { this.script.setMatchSessionService(s); }
}
