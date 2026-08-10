import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";

export class TitleEntity extends BaseGameEntity {
  private text: string = "Unknown";

  constructor() {
    super();
    this.addComponent(new TransformComponent());
    this.getComponent(TransformComponent)!.x = 30;
    this.getComponent(TransformComponent)!.y = 55;
  }

  public setText(text: string): void {
    this.text = text;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "white";
    context.font = "lighter 38px system-ui";
    context.textAlign = "left";
    context.fillText(this.text, this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y);
    context.restore();
  }
}
