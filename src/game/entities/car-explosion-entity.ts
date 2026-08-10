import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { CarExplosionScript } from "../scripts/car-explosion-script.js";

export class CarExplosionEntity extends BaseGameEntity {
  private readonly script: CarExplosionScript;

  constructor(x: number, y: number) {
    super();
    this.script = new CarExplosionScript(x, y);
    this.addComponent(new ScriptComponent(this.script));
  }

  public override update(_delta: DOMHighResTimeStamp): void {
    super.update(_delta);
    if (this.script.isFinished()) this.setRemoved(true);
  }
}
