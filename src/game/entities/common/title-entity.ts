import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { TitleScript } from "../../scripts/title-script.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";

export class TitleEntity extends BaseGameEntity {
  private readonly script: TitleScript;

  constructor() {
    super();
    const transform = this.addComponent(new TransformComponent());
    transform.x = 30; transform.y = 55;

    this.script = new TitleScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveTransform(transform);
  }

  public setText(text: string): void { this.script.text = text; }
}
