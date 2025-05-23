import { BaseTappableGameObject } from "./base/base-tappable-game-object.js";
import { ToggleObject } from "./common/toggle-button.js";

export class SettingObject extends BaseTappableGameObject {
  private toggleObject: ToggleObject | null = null;
  private updated = false;

  constructor(
    private settingId: string,
    private settingText: string,
    private settingState = false
  ) {
    super();
    this.height = 40;
  }

  public override load(): void {
    this.toggleObject = new ToggleObject(this.settingState);
    this.toggleObject.load();
    super.load();
  }

  public getSettingId(): string {
    return this.settingId;
  }

  public getSettingState(): boolean {
    return this.settingState;
  }

  public getUpdated(): boolean {
    return this.updated;
  }

  public setUpdated(updated: boolean): void {
    this.updated = updated;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.isPressed()) {
      this.settingState = !this.settingState;
      this.toggleObject?.setToggleState(this.settingState);
      this.updated = true;
    }

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    // Get the canvas width
    const canvasWidth = context.canvas.width;
    this.width = canvasWidth;

    // Set the font and alignment for the setting text
    context.font = "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";

    // Draw the setting text (left side of the canvas)
    context.fillText(this.settingText, this.x + 30, this.y + this.height / 2);

    // Set the position of the toggleObject (right side of the canvas)
    const toggleX = canvasWidth - 80; // Adjust this value for your toggle object's width
    const toggleY = this.y + 5;

    // Set the position of the toggle object
    this.toggleObject?.setX(toggleX);
    this.toggleObject?.setY(toggleY);

    // Render the toggle object (this assumes render method exists in the ToggleObject class)
    this.toggleObject?.render(context);

    context.restore();

    // Call the parent render method (if needed)
    super.render(context);
  }
}
