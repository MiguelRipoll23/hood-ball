import { GamePointer } from "../../core/models/game-pointer.js";
import { BaseGameEntity } from "../../core/entities/base-game-entity.js";

export class JoystickEntity extends BaseGameEntity {
  private readonly RADIUS: number = 40;
  private readonly MAX_DISTANCE: number = 30;

  private x: number = 0;
  private y: number = 0;

  private active: boolean = false;
  private angle: number = 0;
  private magnitude: number = 1;

  constructor(private readonly gamePointer: GamePointer) {
    super();
  }

  public isActive(): boolean {
    return this.active;
  }

  public getAngle(): number {
    return this.angle;
  }

  public getMagnitude(): number {
    return this.magnitude;
  }

  public override update(): void {
    if (this.gamePointer.isTouch()) {
      this.handleGamePointerEvents();
      this.updateJoystickPosition();
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.gamePointer.isTouch() && this.gamePointer.isPressing()) {
      this.drawJoystick(context);
    }
  }

  private handleGamePointerEvents(): void {
    if (this.gamePointer.isPressing()) {
      this.active = true;
    } else {
      this.reset();
    }
  }

  private updateJoystickPosition(): void {
    const distance = this.calculateDistance();

    if (distance <= this.MAX_DISTANCE) {
      this.x = this.gamePointer.getX();
      this.y = this.gamePointer.getY();
    } else {
      this.adjustPosition();
    }

    this.calculateAngle();
    this.magnitude = Math.min(1, distance / this.MAX_DISTANCE);
  }

  private calculateDistance(): number {
    return Math.sqrt(
      Math.pow(this.gamePointer.getX() - this.gamePointer.getInitialX(), 2) +
        Math.pow(this.gamePointer.getY() - this.gamePointer.getInitialY(), 2)
    );
  }

  private adjustPosition(): void {
    const drawAngle = Math.atan2(
      this.gamePointer.getY() - this.gamePointer.getInitialY(),
      this.gamePointer.getX() - this.gamePointer.getInitialX()
    );

    this.x =
      this.gamePointer.getInitialX() + this.MAX_DISTANCE * Math.cos(drawAngle);

    this.y =
      this.gamePointer.getInitialY() + this.MAX_DISTANCE * Math.sin(drawAngle);
  }

  private calculateAngle(): void {
    const relativeX = this.x - this.gamePointer.getInitialX();
    const relativeY = this.y - this.gamePointer.getInitialY();

    const controlX = relativeX / this.MAX_DISTANCE;
    const controlY = relativeY / this.MAX_DISTANCE;

    this.angle = Math.atan2(-controlY, -controlX);
  }

  private drawJoystick(context: CanvasRenderingContext2D): void {
    this.drawInitialTouchCircleBorder(context);
    this.drawJoystickCircle(context);
  }

  private drawInitialTouchCircleBorder(
    context: CanvasRenderingContext2D
  ): void {
    context.beginPath();
    context.arc(
      this.gamePointer.getInitialX(),
      this.gamePointer.getInitialY(),
      this.RADIUS,
      0,
      Math.PI * 2
    );
    context.strokeStyle = "rgba(0, 0, 0, 0.2)";
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
  }

  private drawJoystickCircle(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.arc(this.x, this.y, this.RADIUS, 0, Math.PI * 2);
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.RADIUS
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(50, 50, 50, 0.8)");
    context.fillStyle = gradient;

    // Save the current state
    context.save();

    // Apply shadow settings only to the joystick
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 10;

    context.fill();

    // Restore the previous state
    context.restore();

    context.closePath();
  }

  private reset(): void {
    this.active = false;
  }
}
