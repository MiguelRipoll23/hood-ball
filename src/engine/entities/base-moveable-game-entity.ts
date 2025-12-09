import { BaseMultiplayerGameEntity } from "./base-multiplayer-entity.ts";

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
}
