import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";

const BUTTON_SIZE = 40;
const TEXT_COLOR = "#ffffff";
const HOVER_COLOR = "#7ed321";

/**
 * Script behaviour for a close (✕) button. Renders the character
 * with hover highlighting.
 * Attached to CloseButtonEntity via ScriptComponent.
 */
export class CloseButtonScript implements ScriptLifecycle {
  private transform!: TransformComponent;
  private input!: InputComponent;

  resolveComponents(transform: TransformComponent, input: InputComponent): void {
    this.transform = transform;
    this.input = input;
  }

  init(): void {
    this.transform.width = BUTTON_SIZE;
    this.transform.height = BUTTON_SIZE;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_delta: DOMHighResTimeStamp): void {
    // Input is handled externally via handlePointerEvent
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    context.font = "28px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = this.input.hovering ? HOVER_COLOR : TEXT_COLOR;
    context.fillText(
      "✕",
      this.transform.x + BUTTON_SIZE / 2,
      this.transform.y + BUTTON_SIZE / 2,
    );

    context.restore();
  }
}
