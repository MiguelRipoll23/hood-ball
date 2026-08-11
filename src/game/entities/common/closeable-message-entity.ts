import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { CloseableMessageScript } from "../../scripts/closeable-message-script.js";

/**
 * Pure component container for a centered closeable message box.
 * All rendering and animation logic lives in {@link CloseableMessageScript}.
 */
export class CloseableMessageEntity extends BaseGameEntity {
  private readonly script: CloseableMessageScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const input = this.addComponent(new InputComponent(true));
    const transform = this.addComponent(new TransformComponent());
    input.active = false;

    this.script = new CloseableMessageScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(canvas, transform, anim, input);
    this.opacity = 0;
  }

  public show(value: string): void { this.script.show(value); }
  public isActive(): boolean { return this.script.active; }
  public isHovering(): boolean { return this.getComponent(InputComponent)?.hovering ?? false; }
  public isPressed(): boolean { return this.getComponent(InputComponent)?.pressed ?? false; }

  public handlePointerEvent(
    gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }

  public close(): void { this.script.close(); }
}
