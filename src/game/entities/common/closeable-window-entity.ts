import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { AnimationComponent } from "../../../engine/components/animation-component.js";
import { CloseableWindowScript } from "../../scripts/closeable-window-script.js";

export class CloseableWindowEntity extends BaseGameEntity {
  protected readonly script: CloseableWindowScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const input = this.addComponent(new InputComponent(true));
    const transform = this.addComponent(new TransformComponent());

    this.script = new CloseableWindowScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, anim, input);
    // Route tap-to-close through the entity so subclasses (e.g.
    // ServerMessageWindowEntity) can override close() behaviour.
    this.script.closeCallback = () => this.close();

    this.opacity = 0;
    input.active = false;
  }

  public override load(): void { this.script.load(); super.load(); }
  public isOpened(): boolean { return this.script.opened; }
  public isClosed(): boolean { return !this.script.opened; }

  public open(titleBarText: string, title: string, content: string, timestamp?: number): void {
    this.script.open(titleBarText, title, content, timestamp);
  }

  public close(): void { this.script.close(); }

  // ── TappableEntity contract ───────────────────────────────────

  public handlePointerEvent(
    gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }

  public isActive(): boolean { return this.script.opened; }
  public isHovering(): boolean { return this.getComponent(InputComponent)?.hovering ?? false; }
  public isPressed(): boolean { return this.getComponent(InputComponent)?.pressed ?? false; }
}
