import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { SnowScript } from "../scripts/snow-script.js";

export class SnowEntity extends BaseGameEntity {
  private readonly script: SnowScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.script = new SnowScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
  }

  public isActive(): boolean { return this.script.isActive(); }

  public override update(_delta: DOMHighResTimeStamp): void {
    super.update(_delta);
    if (this.script.isFinished()) this.setRemoved(true);
  }
}
