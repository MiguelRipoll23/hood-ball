import { BaseTappableGameEntity } from "../../../core/entities/base-tappable-game-entity.js";

export class MenuOptionEntity extends BaseTappableGameEntity {
  private index: number = 0;
  private content: string = "Unknown";
  private requiresOnlineConnection: boolean = false;

  private textX = 0;
  private textY = 0;
  private pinchFactor = 12; // Control the pinch depth for the sides

  constructor(canvas: HTMLCanvasElement, index: number, content: string) {
    super();
    this.index = index;
    this.content = content;
    this.setSize(canvas);
  }

  public getIndex(): number {
    return this.index;
  }

  public getHeight(): number {
    return this.height;
  }

  public getRequiresOnlineConnection(): boolean {
    return this.requiresOnlineConnection;
  }

  public setRequiresOnlineConnection(requiresOnlineConnection: boolean): void {
    this.requiresOnlineConnection = requiresOnlineConnection;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.angle = this.index === 0 ? -0.05 : this.index === 1 ? 0.05 : -0.02;

    this.calculateTextPosition();
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

    if (!this.active) {
      context.fillStyle = "#ccc"; // Gray color for inactive state
    } else if (this.pressed || this.hovering) {
      context.fillStyle = "#7ed321";
    } else {
      context.fillStyle = "#4a90e2";
    }

    context.fill();

    context.fillStyle = "#FFFFFF";
    context.font = "bold 28px system-ui";
    context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);

    context.restore();
    super.render(context);
  }

  private setSize(canvas: HTMLCanvasElement): void {
    this.width = canvas.width - 60;
    this.height = 120;
  }

  private calculateTextPosition(): void {
    this.textX = this.x + this.width / 2 + 8;
    this.textY = this.y + this.height / 2 + 8;
  }
}
