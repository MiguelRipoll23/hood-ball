import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { AnimationComponent } from "../components/animation-component.js";
import { ScriptComponent } from "../components/script-component.js";
import { NotificationScript } from "../scripts/notification-script.js";

export class NotificationEntity extends BaseGameEntity {
  private readonly script: NotificationScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new NotificationScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, anim);
    this.opacity = 0;
  }

  public show(text: string): void { this.script.show(text); }
}
