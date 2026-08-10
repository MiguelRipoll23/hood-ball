import { BaseGameEntity } from "./base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";

export class HitboxEntity extends BaseGameEntity {
  private _x: number = 0;
  private _y: number = 0;
  private _width: number = 0;
  private _height: number = 0;
  private colliding: boolean = false;

  constructor(x: number, y: number, width: number, height: number) {
    super();
    this.addComponent(new TransformComponent());

    this.setPosition(x, y);
    this.setSize(width, height);
  }

  public setX(x: number): void {
    this._x = x;
  }

  public getX(): number {
    return this._x;
  }

  public setY(y: number): void {
    this._y = y;
  }

  public getY(): number {
    return this._y;
  }

  public getWidth(): number {
    return this._width;
  }

  public getHeight(): number {
    return this._height;
  }

  public isColliding(): boolean {
    return this.colliding;
  }

  public setColliding(colliding: boolean): void {
    this.colliding = colliding;
  }

  /**
   * Hitbox rendering is now handled by {@link CollisionComponent.render}.
   * This method is a no-op — kept to satisfy the GameEntity interface.
   */
  public render(_context: CanvasRenderingContext2D): void {
    // Hitbox debug overlay rendering moved to CollisionComponent.render()
  }

  private setPosition(x: number, y: number): void {
    this._x = x;
    this._y = y;
  }

  private setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.getComponent(TransformComponent)!.width = width;
    this.getComponent(TransformComponent)!.height = height;
  }
}
