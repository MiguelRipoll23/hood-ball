import { injectable } from "@needle-di/core";

@injectable()
export class CameraService {
  private shakeDuration = 0;
  private shakeElapsed = 0;
  private magnitude = 0;
  private offsetX = 0;
  private offsetY = 0;

  public shake(durationSeconds: number, magnitude: number): void {
    this.shakeDuration = durationSeconds * 1000;
    this.shakeElapsed = 0;
    this.magnitude = magnitude;
  }

  public update(delta: DOMHighResTimeStamp): void {
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += delta;
      const progress =
        (this.shakeDuration - this.shakeElapsed) / this.shakeDuration;
      this.offsetX = (Math.random() * 2 - 1) * this.magnitude * progress;
      this.offsetY = (Math.random() * 2 - 1) * this.magnitude * progress;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  public applyTransform(context: CanvasRenderingContext2D): void {
    if (this.offsetX !== 0 || this.offsetY !== 0) {
      context.translate(this.offsetX, this.offsetY);
    }
  }
}

