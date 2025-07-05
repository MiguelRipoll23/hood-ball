import { BaseTappableGameEntity } from "../../core/entities/base-tappable-game-entity.js";

export class ButtonEntity extends BaseTappableGameEntity {
  private text: string = "Unknown";
  private pinchFactor = 2; // Control the pinch depth for the sides

  constructor(canvas: HTMLCanvasElement, text: string) {
    super();
    this.text = text;
    this.setSize(canvas);
  }

  public setPosition(x: number, y: number): void {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  private setSize(canvas: HTMLCanvasElement): void {
    this.width = canvas.getContext("2d")?.measureText(this.text).width || 0;
    this.width *= 3;
    this.height = 60;
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();

    context.translate(this.x + this.width / 2, this.y + this.height / 2);
    context.rotate(this.angle);
    context.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

    context.beginPath();

    // Top side with single pinch in the center
    context.moveTo(this.x + this.pinchFactor, this.y);
    context.quadraticCurveTo(
      this.x + this.width / 2,
      this.y - this.pinchFactor, // Pinch inward at the center
      this.x + this.width - this.pinchFactor,
      this.y
    );

    // Top right corner transitioning from top side to right side
    context.quadraticCurveTo(
      this.x + this.width,
      this.y,
      this.x + this.width,
      this.y + this.pinchFactor
    );

    // Right side with single pinch in the center
    context.lineTo(this.x + this.width, this.y + this.pinchFactor);
    context.quadraticCurveTo(
      this.x + this.width + this.pinchFactor / 2, // Pinch inward at the center
      this.y + this.height / 2,
      this.x + this.width,
      this.y + this.height - this.pinchFactor
    );

    // Bottom right corner transitioning from right side to bottom side
    context.quadraticCurveTo(
      this.x + this.width,
      this.y + this.height,
      this.x + this.width - this.pinchFactor,
      this.y + this.height
    );

    // Bottom side with single pinch in the center
    context.lineTo(
      this.x + this.width - this.pinchFactor,
      this.y + this.height
    );
    context.quadraticCurveTo(
      this.x + this.width / 2,
      this.y + this.height + this.pinchFactor, // Pinch inward at the center
      this.x + this.pinchFactor,
      this.y + this.height
    );

    // Bottom left corner transitioning from bottom side to left side
    context.quadraticCurveTo(
      this.x,
      this.y + this.height,
      this.x,
      this.y + this.height - this.pinchFactor
    );

    // Left side with single pinch in the center
    context.lineTo(this.x, this.y + this.height - this.pinchFactor);
    context.quadraticCurveTo(
      this.x - this.pinchFactor / 2, // Pinch inward at the center
      this.y + this.height / 2,
      this.x,
      this.y + this.pinchFactor
    );

    // Top left corner transitioning from left side to top side
    context.quadraticCurveTo(this.x, this.y, this.x + this.pinchFactor, this.y);

    context.closePath();

    if (this.pressed || this.hovering) {
      context.fillStyle = "#7ed321";
    } else {
      context.fillStyle = "#4a90e2";
    }

    context.fill();

    context.fillStyle = "#FFFFFF";
    context.font = "bold 28px system-ui";
    context.textAlign = "center";
    context.fillText(
      this.text,
      this.x + this.width / 2, // Center horizontally
      this.y + this.height / 2 + 10 // Center vertically, with an adjustment for baseline
    );

    context.restore();
    super.render(context);
  }
}
