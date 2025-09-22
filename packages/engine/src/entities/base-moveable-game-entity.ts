import { BaseMultiplayerGameEntity } from "./base-multiplayer-entity.js";

export class BaseMoveableGameEntity<
  TTypeId = unknown,
  TOwner = unknown
> extends BaseMultiplayerGameEntity<TTypeId, TOwner> {
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
}
