import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";

export class ToggleEntity extends BaseGameEntity {
  private radius: number = 15; // Adjusted radius for rounded corners based on height

  constructor(private toggleState = false) {
    super();
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ render: (ctx) => this.scriptRender(ctx) }));
    this.getComponent(TransformComponent)!.width = 55;
    this.getComponent(TransformComponent)!.height = 30;
  }

  public setToggleState(toggleState: boolean): void {
    this.toggleState = toggleState;
  }

  public setX(x: number): void { this.getComponent(TransformComponent)!.x = x; }
  public setY(y: number): void { this.getComponent(TransformComponent)!.y = y; }

  private scriptRender(context: CanvasRenderingContext2D): void {

    // Draw the background (rounded rectangle)
    context.fillStyle = this.toggleState ? "#4CAF50" : "#ccc"; // Green when on, grey when off
    context.beginPath();
    context.moveTo(this.getComponent(TransformComponent)!.x + this.radius, this.getComponent(TransformComponent)!.y);
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.radius
    );
    context.arcTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.radius
    );
    context.arcTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height, this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.radius);
    context.arcTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.y, this.radius);
    context.closePath();
    context.fill();

    // Draw the circle (toggle button)
    const circleX = this.toggleState
      ? this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.getComponent(TransformComponent)!.height / 2
      : this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.height / 2;
    context.fillStyle = "#fff"; // White color for the toggle circle
    context.beginPath();
    context.arc(
      circleX,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2,
      this.getComponent(TransformComponent)!.height / 2 - 5,
      0,
      Math.PI * 2
    );
    context.closePath();
    context.fill();
  }
}
