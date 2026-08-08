import { BaseMultiplayerGameEntity } from "./base-multiplayer-entity.js";
import { TransformComponent } from "../components/transform-component.js";
import { AnimationType } from "../enums/animation-type.js";
import { EntityAnimationService } from "../services/gameplay/entity-animation-service.js";

export class BaseMoveableGameEntity extends BaseMultiplayerGameEntity {
  protected animationTasks: EntityAnimationService[] = [];

  /** Backing TransformComponent — all position/size/angle getters delegate here. */
  protected readonly transform: TransformComponent;

  constructor() {
    super();
    this.transform = this.addComponent(new TransformComponent());
  }

  // ── Transform getters/setters (single source of truth) ─────────

  protected get x(): number {
    return this.transform.x;
  }

  protected set x(value: number) {
    this.transform.x = value;
  }

  protected get y(): number {
    return this.transform.y;
  }

  protected set y(value: number) {
    this.transform.y = value;
  }

  protected get width(): number {
    return this.transform.width;
  }

  protected set width(value: number) {
    this.transform.width = value;
  }

  protected get height(): number {
    return this.transform.height;
  }

  protected set height(value: number) {
    this.transform.height = value;
  }

  protected get angle(): number {
    return this.transform.angle;
  }

  protected set angle(value: number) {
    this.transform.angle = value;
  }

  protected get scale(): number {
    return this.transform.scale;
  }

  protected set scale(value: number) {
    this.transform.scale = value;
  }

  protected get skipInterpolation(): boolean {
    return this.transform.skipInterpolation;
  }

  protected set skipInterpolation(value: boolean) {
    this.transform.skipInterpolation = value;
  }

  // ── Public Transform API ───────────────────────────────────────

  public getX(): number {
    return this.transform.x;
  }

  public setX(x: number): void {
    this.transform.x = x;
  }

  public getY(): number {
    return this.transform.y;
  }

  public setY(y: number): void {
    this.transform.y = y;
  }

  public getWidth(): number {
    return this.transform.width;
  }

  public setWidth(width: number): void {
    this.transform.width = width;
  }

  public getHeight(): number {
    return this.transform.height;
  }

  public setHeight(height: number): void {
    this.transform.height = height;
  }

  public getAngle(): number {
    return this.transform.angle;
  }

  public setAngle(angle: number): void {
    this.transform.angle = angle;
  }

  public setSkipInterpolation(): void {
    this.transform.skipInterpolation = true;
  }

  public teleport(x: number, y: number, angle?: number): void {
    this.transform.teleport(x, y, angle);
  }

  // ── Scale ──────────────────────────────────────────────────────

  public getScale(): number {
    return this.scale;
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  // ── Animations ─────────────────────────────────────────────────

  public fadeIn(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(this, AnimationType.FadeIn, 0, 1, seconds)
    );
  }

  public fadeOut(seconds: number): void {
    this.animationTasks.push(
      new EntityAnimationService(this, AnimationType.FadeOut, 1, 0, seconds)
    );
  }

  public moveToX(newX: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveX,
        this.x,
        newX,
        seconds
      )
    );
  }

  public moveToY(newY: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.MoveY,
        this.y,
        newY,
        seconds
      )
    );
  }

  public rotateTo(newAngle: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Rotate,
        this.angle,
        newAngle,
        seconds
      )
    );
  }

  public scaleTo(newScale: number, seconds: number) {
    this.animationTasks.push(
      new EntityAnimationService(
        this,
        AnimationType.Scale,
        this.scale,
        newScale,
        seconds
      )
    );
  }

  // ── Debug overlay ──────────────────────────────────────────────

  private static readonly HEXAGON_SIDES = 6;
  private static readonly HEXAGON_RADIUS = 25;
  private static readonly HEXAGON_COLOR = "rgba(255, 105, 180, 0.45)";

  public override render(context: CanvasRenderingContext2D): void {
    super.render(context);

    if (
      !this.debugSettings?.showSyncableEntitiesOverlay() ||
      !this.isSyncable()
    ) return;

    this.drawHexagon(context);
  }

  private drawHexagon(context: CanvasRenderingContext2D): void {
    const cx = this.getX();
    const cy = this.getY();

    context.save();
    context.strokeStyle = BaseMoveableGameEntity.HEXAGON_COLOR;
    context.lineWidth = 1.5;
    context.beginPath();

    const r = BaseMoveableGameEntity.HEXAGON_RADIUS;
    for (let i = 0; i < BaseMoveableGameEntity.HEXAGON_SIDES; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.stroke();
    context.restore();
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  public reset(): void {
    this.animationTasks.length = 0;
    super.reset();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.animationTasks.forEach((animation) => {
      animation.update(deltaTimeStamp);

      // Remove completed animations
      if (animation.isCompleted()) {
        const index = this.animationTasks.indexOf(animation);
        this.animationTasks.splice(index, 1);
      }
    });

    super.update(deltaTimeStamp);
  }
}
