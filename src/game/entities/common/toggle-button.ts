import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { ToggleScript } from "../../scripts/toggle-script.js";

export class ToggleEntity extends BaseGameEntity {
  private readonly script: ToggleScript;

  constructor(toggleState = false) {
    super();
    const transform = this.addComponent(new TransformComponent());

    this.script = new ToggleScript(toggleState);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveTransform(transform);

    transform.width = 55;
    transform.height = 30;
  }

  public setToggleState(s: boolean): void { this.script.toggleState = s; }
  public setX(x: number): void { this.getComponent(TransformComponent)!.x = x; }
  public setY(y: number): void { this.getComponent(TransformComponent)!.y = y; }
}
