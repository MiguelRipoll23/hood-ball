import { BaseGameEntity } from "../../../core/entities/base-game-entity.js";

export class MainBackgroundEntity extends BaseGameEntity {
  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
  }

  public override load(): void {
    super.load();
  }

  public render(context: CanvasRenderingContext2D) {
    this.drawGradientSky(context);
  }

  private drawGradientSky(context: CanvasRenderingContext2D): void {
    const gradient = context.createLinearGradient(
      0,
      0,
      this.canvas.width,
      this.canvas.height / 2
    );
    gradient.addColorStop(0, "#000428");
    gradient.addColorStop(1, "#004e92");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
