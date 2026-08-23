import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { LoadingBackgroundScript } from "../../scripts/loading-background-script.js";

export class LoadingBackgroundEntity extends BaseGameEntity {
  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new ScriptComponent(new LoadingBackgroundScript(canvas)));
  }
}
