import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";
import { MessageScript } from "../../scripts/message-script.js";

export class MessageEntity extends BaseGameEntity {
  private readonly script: MessageScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new MessageScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(canvas, transform, anim);
    this.opacity = 0;
  }

  public show(value: string): void { this.script.show(value); }
  public hide(): void { this.script.hide(); }
}
