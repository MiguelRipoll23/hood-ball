import { BaseAnimatedGameObject } from "../base/base-animated-object.js";

export class BackdropObject extends BaseAnimatedGameObject {
  private readonly FILL_COLOR = "rgba(0, 0, 0, 0.8)";

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.reset();
  }

  public render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.FILL_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
