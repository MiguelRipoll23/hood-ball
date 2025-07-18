import { BaseTappableGameEntity } from "../../core/entities/base-tappable-game-entity.js";
import { ToggleEntity } from "./common/toggle-button.js";

export class SettingEntity extends BaseTappableGameEntity {
  private toggleEntity: ToggleEntity | null = null;
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
    this.toggleEntity = new ToggleEntity(this.settingState);
    this.toggleEntity.load();
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
      this.toggleEntity?.setToggleState(this.settingState);
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

    // Set the position of the toggleEntity (right side of the canvas)
    const toggleX = canvasWidth - 80; // Adjust this value for your toggle entity's width
    const toggleY = this.y + 5;

    // Set the position of the toggle entity
    this.toggleEntity?.setX(toggleX);
    this.toggleEntity?.setY(toggleY);

    // Render the toggle entity (this assumes render method exists in the ToggleEntity class)
    this.toggleEntity?.render(context);

    context.restore();

    // Call the parent render method (if needed)
    super.render(context);
  }
}
