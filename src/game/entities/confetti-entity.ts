import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { ConfettiScript } from "../scripts/confetti-script.js";

export class ConfettiEntity extends BaseGameEntity {
  private readonly script: ConfettiScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.script = new ConfettiScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
  }

  public override update(_delta: DOMHighResTimeStamp): void {
    super.update(_delta);
    if (this.script.isFinished()) this.setRemoved(true);
  }
}
