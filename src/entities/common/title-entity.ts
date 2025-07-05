import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";

export class TitleEntity extends BaseMoveableGameEntity {
  private text: string = "Unknown";

  constructor() {
    super();
    this.x = 30;
    this.y = 55;
  }

  public setText(text: string): void {
    this.text = text;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "white";
    context.font = "lighter 38px system-ui";
    context.textAlign = "left";
    context.fillText(this.text, this.x, this.y);
  }
}
