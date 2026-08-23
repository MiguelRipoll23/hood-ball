import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { SmallButtonScript } from "../../scripts/small-button-script.js";

export class SmallButtonEntity extends BaseGameEntity {
  private readonly script: SmallButtonScript;

  constructor(
    text: string, width: number, height: number,
    backgroundColor = "rgba(200, 50, 50, 0.8)",
    hoverColor = "rgba(220, 60, 60, 0.9)",
    textColor = "#ffffff", radius = 20,
  ) {
    super();
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());
    transform.width = width; transform.height = height;

    this.script = new SmallButtonScript(text, backgroundColor, hoverColor, textColor, radius);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);
  }

  public setPosition(x: number, y: number): void { const t = this.getComponent(TransformComponent)!; t.x = x; t.y = y; }
  public setDisabled(d: boolean): void { this.script.disabled = d; if (d) { const i = this.getComponent(InputComponent)!; i.hovering = false; i.pressed = false; } }
  public isDisabled(): boolean { return this.script.disabled; }
  public isActive(): boolean { return this.getComponent(InputComponent)!.active; }
  public isButtonPressed(): boolean { return this.script.isButtonPressed(); }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public handlePointerEvent(gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    if (this.script.disabled) return;
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }
}
