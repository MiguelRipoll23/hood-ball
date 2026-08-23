import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { HelpScript } from "../scripts/help-script.js";

/**
 * Pure component container for the help text box. All rendering, text
 * measurement, and animation logic lives in {@link HelpScript}.
 */
export class HelpEntity extends BaseGameEntity {
  private readonly script: HelpScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new HelpScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(canvas, transform, anim);
    this.script.init();
  }

  public show(text: string, duration = 0): void {
    this.script.show(text, duration);
  }

  public hide(): void {
    this.script.hide();
  }
}
