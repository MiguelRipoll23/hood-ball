import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";

export class CloseButtonEntity extends BaseTappableGameEntity {
  private readonly BUTTON_SIZE = 40;
  private readonly TEXT_COLOR = "#ffffff";
  private readonly HOVER_COLOR = "#7ed321";

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.width = this.BUTTON_SIZE;
    this.height = this.BUTTON_SIZE;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Only call super.update(delta) after handling press event!

    super.update(delta);
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();

    context.font = "28px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = this.hovering ? this.HOVER_COLOR : this.TEXT_COLOR;
    context.fillText(
      "✕",
      this.x + this.BUTTON_SIZE / 2,
      this.y + this.BUTTON_SIZE / 2
    );

    context.restore();
  }
}
