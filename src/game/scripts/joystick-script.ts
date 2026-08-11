import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { InputComponent } from "../../engine/components/input-component.js";

/**
 * Script behaviour encapsulating joystick logic (touch input, angle/magnitude
 * calculation, and rendering). Attached to JoystickEntity via ScriptComponent.
 */
export class JoystickScript implements ScriptLifecycle {
  private readonly RADIUS = 40;
  private readonly MAX_DISTANCE = 30;

  private _jx = 0;
  private _jy = 0;
  private _jactive = false;
  private _ja = 0;
  magnitude = 1;

  private input!: InputComponent;

  constructor(private readonly gamePointer: GamePointerContract) {}

  resolveInput(input: InputComponent): void {
    this.input = input;
  }

  isActive(): boolean {
    return this._jactive;
  }

  getAngle(): number {
    return this._ja;
  }

  getMagnitude(): number {
    return this.magnitude;
  }

  update(): void {
    if (this.gamePointer.isTouch()) {
      this.handleGamePointerEvents();
      this.updateJoystickPosition();
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.gamePointer.isTouch() && this.gamePointer.isPressing()) {
      this.drawJoystick(context);
    }
  }

  private handleGamePointerEvents(): void {
    if (this.gamePointer.isPressing()) {
      this._jactive = true;
    } else {
      this.resetJoystick();
    }
  }

  private updateJoystickPosition(): void {
    const distance = this.calculateDistance();

    if (distance <= this.MAX_DISTANCE) {
      this._jx = this.gamePointer.getX();
      this._jy = this.gamePointer.getY();
    } else {
      this.adjustPosition();
    }

    this.calculateAngle();
    this.magnitude = Math.min(1, distance / this.MAX_DISTANCE);
  }

  private calculateDistance(): number {
    return Math.sqrt(
      (this.gamePointer.getX() - this.gamePointer.getInitialX()) ** 2 +
        (this.gamePointer.getY() - this.gamePointer.getInitialY()) ** 2,
    );
  }

  private adjustPosition(): void {
    const drawAngle = Math.atan2(
      this.gamePointer.getY() - this.gamePointer.getInitialY(),
      this.gamePointer.getX() - this.gamePointer.getInitialX(),
    );

    this._jx =
      this.gamePointer.getInitialX() + this.MAX_DISTANCE * Math.cos(drawAngle);
    this._jy =
      this.gamePointer.getInitialY() + this.MAX_DISTANCE * Math.sin(drawAngle);
  }

  private calculateAngle(): void {
    const relativeX = this._jx - this.gamePointer.getInitialX();
    const relativeY = this._jy - this.gamePointer.getInitialY();

    const controlX = relativeX / this.MAX_DISTANCE;
    const controlY = relativeY / this.MAX_DISTANCE;

    this._ja = Math.atan2(-controlY, -controlX);
  }

  private drawJoystick(context: CanvasRenderingContext2D): void {
    this.drawInitialTouchCircleBorder(context);
    this.drawJoystickCircle(context);
  }

  private drawInitialTouchCircleBorder(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.arc(
      this.gamePointer.getInitialX(),
      this.gamePointer.getInitialY(),
      this.RADIUS,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = "rgba(0, 0, 0, 0.2)";
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
  }

  private drawJoystickCircle(context: CanvasRenderingContext2D): void {
    context.beginPath();
    context.arc(this._jx, this._jy, this.RADIUS, 0, Math.PI * 2);
    const gradient = context.createRadialGradient(
      this._jx,
      this._jy,
      0,
      this._jx,
      this._jy,
      this.RADIUS,
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(50, 50, 50, 0.8)");
    context.fillStyle = gradient;

    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 10;
    context.fill();
    context.restore();

    context.closePath();
  }

  private resetJoystick(): void {
    this.input.active = false;
  }
}
