import { BaseMultiplayerGameEntity } from "./base-multiplayer-entity.js";

export class BaseMoveableGameEntity extends BaseMultiplayerGameEntity {
  protected x: number = 0;
  protected y: number = 0;
  protected width: number = 0;
  protected height: number = 0;
  protected angle: number = 0;
  protected skipInterpolation = false;

  constructor() {
    super();
  }

  public getX(): number {
    return this.x;
  }

  public setX(x: number): void {
    this.x = x;
  }

  public getY(): number {
    return this.y;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public getWidth(): number {
    return this.width;
  }

  public setWidth(width: number): void {
    this.width = width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setHeight(height: number): void {
    this.height = height;
  }

  public getAngle(): number {
    return this.angle;
  }

  public setAngle(angle: number): void {
    this.angle = angle;
  }

  public setSkipInterpolation(): void {
    this.skipInterpolation = true;
  }

  public teleport(x: number, y: number, angle?: number): void {
    this.x = x;
    this.y = y;
    if (angle !== undefined) {
      this.angle = angle;
    }
    // Set skip interpolation for the next network update
    this.skipInterpolation = true;
  }

  public override serializeForRecording(): Record<string, unknown> {
    return {
      ...super.serializeForRecording(),
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      angle: this.angle,
    };
  }

  public override deserializeFromRecording(data: Record<string, unknown>): void {
    super.deserializeFromRecording(data);
    if (typeof data.x === "number") this.x = data.x;
    if (typeof data.y === "number") this.y = data.y;
    if (typeof data.width === "number") this.width = data.width;
    if (typeof data.height === "number") this.height = data.height;
    if (typeof data.angle === "number") this.angle = data.angle;
  }
}
