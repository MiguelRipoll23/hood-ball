import { BaseGameEntity } from "../../../core/entities/base-game-entity.js";

export class MainBackgroundEntity extends BaseGameEntity {
  private gradient: CanvasGradient | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
  }

  public override load(): void {
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      this.gradient = ctx.createLinearGradient(
        0,
        0,
        this.canvas.width,
        this.canvas.height / 2
      );
      this.gradient.addColorStop(0, "#000428");
      this.gradient.addColorStop(1, "#004e92");
    }
    super.load();
  }

  public render(context: CanvasRenderingContext2D) {
    this.drawGradientSky(context);
  }

  private drawGradientSky(context: CanvasRenderingContext2D): void {
    if (!this.gradient) {
      this.gradient = context.createLinearGradient(
        0,
        0,
        this.canvas.width,
        this.canvas.height / 2
      );
      this.gradient.addColorStop(0, "#000428");
      this.gradient.addColorStop(1, "#004e92");
    }

    context.fillStyle = this.gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
