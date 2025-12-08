import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";

export class LoadingBackgroundEntity extends BaseGameEntity {
  private gradientOffset = 0; // Offset for moving gradient

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
  }

  // Update the gradient offset to animate the background
  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.gradientOffset += deltaTimeStamp * 0.01; // Adjust speed as needed
    if (this.gradientOffset > this.canvas.width) {
      this.gradientOffset = 0; // Loop the gradient
    }
  }

  public render(context: CanvasRenderingContext2D) {
    this.drawMovingGradientSky(context);
  }

  private drawMovingGradientSky(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(
      this.gradientOffset,
      0,
      this.canvas.width + this.gradientOffset,
      this.canvas.height / 2
    );
    gradient.addColorStop(0, "#000428");
    gradient.addColorStop(1, "#004e92");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
