import { BaseGameEntity } from "./base-game-entity.js";

export class HitboxEntity extends BaseGameEntity {
  private x: number = 0;
  private y: number = 0;
  private width: number = 0;
  private height: number = 0;
  private colliding: boolean = false;

  constructor(x: number, y: number, width: number, height: number) {
    super();

    this.setPosition(x, y);
    this.setSize(width, height);
  }

  public setX(x: number): void {
    this.x = x;
  }

  public getX(): number {
    return this.x;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public getY(): number {
    return this.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
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
    this.x = x;
    this.y = y;
  }

  private setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
