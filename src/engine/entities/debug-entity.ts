import { BaseGameEntity } from "./base-game-entity.js";
import { AnimationComponent } from "../components/animation-component.js";
import { ScriptComponent } from "../components/script-component.js";
import { DebugScript } from "../scripts/debug-script.js";

export class DebugEntity extends BaseGameEntity {
  private readonly script: DebugScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    this.opacity = 0;

    this.script = new DebugScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveAnimation(anim);
  }

  public show(text: string, duration = 0): void { this.script.show(text, duration); }
  public hide(): void { this.script.hide(); }
}
