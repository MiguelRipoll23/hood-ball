import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { ScriptComponent } from "../components/script-component.js";
import { LoadingIndicatorScript } from "../scripts/loading-indicator-script.js";

export class LoadingIndicatorEntity extends BaseGameEntity {
  private readonly script: LoadingIndicatorScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const transform = this.addComponent(new TransformComponent());
    this.script = new LoadingIndicatorScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveTransform(transform);
  }

  public show(): void { this.script.visible = true; }
  public hide(): void { this.script.visible = false; }
}
