import { BaseAnimatedGameObject } from "../base/base-animated-object.js";

export class ToggleObject extends BaseAnimatedGameObject {
  protected width: number = 55; // Incremented width to 55
  protected height: number = 30;
  private radius: number = 15; // Adjusted radius for rounded corners based on height

  constructor(private toggleState = false) {
    super();
  }

  public setToggleState(toggleState: boolean): void {
    this.toggleState = toggleState;
  }

  public override render(context: CanvasRenderingContext2D): void {
    super.render(context);

    // Draw the background (rounded rectangle)
    context.fillStyle = this.toggleState ? "#4CAF50" : "#ccc"; // Green when on, grey when off
    context.beginPath();
    context.moveTo(this.x + this.radius, this.y);
    context.arcTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.height,
      this.radius
    );
    context.arcTo(
      this.x + this.width,
      this.y + this.height,
      this.x,
      this.y + this.height,
      this.radius
    );
    context.arcTo(this.x, this.y + this.height, this.x, this.y, this.radius);
    context.arcTo(this.x, this.y, this.x + this.width, this.y, this.radius);
    context.closePath();
    context.fill();

    // Draw the circle (toggle button)
    const circleX = this.toggleState
      ? this.x + this.width - this.height / 2
      : this.x + this.height / 2;
    context.fillStyle = "#fff"; // White color for the toggle circle
    context.beginPath();
    context.arc(
      circleX,
      this.y + this.height / 2,
      this.height / 2 - 5,
      0,
      Math.PI * 2
    );
    context.closePath();
    context.fill();
  }
}
