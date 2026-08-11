import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { CloseButtonScript } from "../scripts/close-button-script.js";

/**
 * Pure component container for a close (✕) button. All rendering
 * and hover logic lives in {@link CloseButtonScript}.
 */
export class CloseButtonEntity extends BaseGameEntity {
  private readonly script: CloseButtonScript;

  constructor(x: number, y: number) {
    super();
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new CloseButtonScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);
    this.script.init();

    transform.x = x;
    transform.y = y;
  }

  public isActive(): boolean { return this.getComponent(InputComponent)!.active; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }
  public handlePointerEvent(
    gp: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
  }
}
