import { GamePointer } from "../models/game-pointer.js";
import { BaseGameObject } from "./base/base-game-object.js";

export class JoystickObject extends BaseGameObject {
  private readonly RADIUS: number = 40;
  private readonly MAX_DISTANCE: number = 30;

  private x: number = 0;
  private y: number = 0;

  private active: boolean = false;
  private angle: number = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gamePointer: GamePointer
  ) {
    super();
  }

  public override update() {
    if (this.gamePointer.isTouch()) {
      this.handleGamePointerEvents();
      this.updateJoystickPosition();
    }
  }

  public render(context: CanvasRenderingContext2D) {
    if (this.gamePointer.isTouch() && this.gamePointer.isPressing()) {
      this.drawJoystick(context);
    }
  }

  private handleGamePointerEvents() {
    if (this.gamePointer.isPressing()) {
      this.active = true;
    } else {
      this.reset();
    }
  }

  private updateJoystickPosition() {
    const distance = this.calculateDistance();

    if (distance <= this.MAX_DISTANCE) {
      this.x = this.gamePointer.getX();
      this.y = this.gamePointer.getY();
    } else {
      this.adjustPosition();
    }

    this.calculateAngle();
  }

  private calculateDistance(): number {
    return Math.sqrt(
      Math.pow(this.gamePointer.getX() - this.gamePointer.getInitialX(), 2) +
        Math.pow(this.gamePointer.getY() - this.gamePointer.getInitialY(), 2)
    );
  }

  private adjustPosition() {
    const drawAngle = Math.atan2(
      this.gamePointer.getY() - this.gamePointer.getInitialY(),
      this.gamePointer.getX() - this.gamePointer.getInitialX()
    );

    this.x =
      this.gamePointer.getInitialX() + this.MAX_DISTANCE * Math.cos(drawAngle);

    this.y =
      this.gamePointer.getInitialY() + this.MAX_DISTANCE * Math.sin(drawAngle);
  }

  private calculateAngle() {
    const relativeX = this.x - this.gamePointer.getInitialX();
    const relativeY = this.y - this.gamePointer.getInitialY();

    const controlX = relativeX / this.MAX_DISTANCE;
    const controlY = relativeY / this.MAX_DISTANCE;

    this.angle = Math.atan2(-controlY, -controlX);
  }

  public isActive() {
    return this.active;
  }

  public getAngle(): number {
    return this.angle; // The angle is now always in radians
  }

  private drawJoystick(context: CanvasRenderingContext2D) {
    this.drawInitialTouchCircleBorder(context);
    this.drawJoystickCircle(context);
  }

  private drawInitialTouchCircleBorder(context: CanvasRenderingContext2D) {
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

  private drawJoystickCircle(context: CanvasRenderingContext2D) {
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

  private reset() {
    this.active = false;
  }
}
