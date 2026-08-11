import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { MainBackgroundScript } from "../../scripts/main-background-script.js";

export class MainBackgroundEntity extends BaseGameEntity {
  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new ScriptComponent(new MainBackgroundScript(canvas)));
  }
}
