import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";
import { ToastScript } from "../../scripts/toast-script.js";

export class ToastEntity extends BaseGameEntity {
  private readonly script: ToastScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new ToastScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, anim);
    this.script.init();
  }

  public show(text: string, duration = 0): void { this.script.show(text, duration); }
  public hide(): void { this.script.hide(); }

  public override setOpacity(v: number): void { super.setOpacity(v); this.script.setOpacityFromEntity(v); }
}
