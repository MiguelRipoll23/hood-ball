import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { BackdropScript } from "../../scripts/backdrop-script.js";

export class BackdropEntity extends BaseGameEntity {
  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new ScriptComponent(new BackdropScript(canvas)));
  }
}
