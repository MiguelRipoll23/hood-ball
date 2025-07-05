import { BaseGameEntity } from "../../../core/entities/base-game-entity.js";
import { CarSilhouetteEntity } from "./car-silhouette-entity.js";

export class MainBackgroundEntity extends BaseGameEntity {
  private gradientOffset = 0; // Offset for moving gradient
  private readonly carSilhouettes: CarSilhouetteEntity;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.carSilhouettes = new CarSilhouetteEntity(canvas);
  }

  public override load(): void {
    this.carSilhouettes.load();
    super.load();
  }

  // Update the gradient offset to animate the background
  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.gradientOffset += deltaTimeStamp * 0.01; // Adjust speed as needed
    if (this.gradientOffset > this.canvas.width) {
      this.gradientOffset = 0; // Loop the gradient
    }

    this.carSilhouettes.update(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D) {
    this.drawMovingGradientSky(context);
    this.carSilhouettes.render(context);
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
