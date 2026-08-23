import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import { ToggleEntity } from "../entities/common/toggle-button.js";

/**
 * Script behaviour for a settings toggle row. Handles input detection
 * and renders the setting label + toggle switch.
 * Attached to SettingEntity via ScriptComponent.
 */
export class SettingScript implements ScriptLifecycle {
  toggleEntity: ToggleEntity | null = null;
  updated = false;
  indented = false;

  private settingText: string;
  private settingState: boolean;

  private transform!: TransformComponent;
  private input!: InputComponent;

  constructor(settingText: string, settingState: boolean) {
    this.settingText = settingText;
    this.settingState = settingState;
  }

  resolveComponents(transform: TransformComponent, input: InputComponent): void {
    this.transform = transform;
    this.input = input;
  }

  init(): void {
    this.transform.height = 40;
    this.toggleEntity = new ToggleEntity(this.settingState);
    this.toggleEntity.load();
  }

  getSettingState(): boolean {
    return this.settingState;
  }

  update(_delta: DOMHighResTimeStamp): void {
    if (this.input.pressed) {
      this.settingState = !this.settingState;
      this.toggleEntity?.setToggleState(this.settingState);
      this.updated = true;
    }
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();

    const canvasWidth = context.canvas.width;
    this.transform.width = canvasWidth;

    context.fillStyle = "white";
    context.font = this.indented ? "bold 20px system-ui" : "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";

    const textX = this.indented
      ? this.transform.x + 50
      : this.transform.x + 30;
    context.fillText(
      this.settingText,
      textX,
      this.transform.y + this.transform.height / 2,
    );

    const toggleX = canvasWidth - 80;
    const toggleY = this.transform.y + 5;

    this.toggleEntity?.setX(toggleX);
    this.toggleEntity?.setY(toggleY);
    this.toggleEntity?.render(context);

    context.restore();
  }
}
