import { BaseMultiplayerGameObject } from "./base-multiplayer-object.js";

export class BaseMoveableGameObject extends BaseMultiplayerGameObject {
  protected x: number = 0;
  protected y: number = 0;
  protected width: number = 0;
  protected height: number = 0;
  protected angle: number = 0;

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
}
