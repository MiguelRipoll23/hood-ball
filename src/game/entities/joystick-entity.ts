import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { InputComponent } from "../../engine/components/input-component.js";

export class JoystickEntity extends BaseGameEntity {
  private readonly RADIUS: number = 40;
  private readonly MAX_DISTANCE: number = 30;

  private _jx: number = 0;
  private _jy: number = 0;

  private _jactive: boolean = false;
  private _ja: number = 0;
  private magnitude: number = 1;

  constructor(private readonly gamePointer: GamePointerContract) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new ScriptComponent({ update: () => this.scriptUpdate() }));
  }

  public isActive(): boolean {
    return this._jactive;
  }

  public getAngle(): number {
    return this._ja;
  }

  public getMagnitude(): number {
    return this.magnitude;
  }

  private scriptUpdate(): void {
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
      Math.pow(this.gamePointer.getX() - this.gamePointer.getInitialX(), 2) +
        Math.pow(this.gamePointer.getY() - this.gamePointer.getInitialY(), 2)
    );
  }

  private adjustPosition(): void {
    const drawAngle = Math.atan2(
      this.gamePointer.getY() - this.gamePointer.getInitialY(),
      this.gamePointer.getX() - this.gamePointer.getInitialX()
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
    context.arc(this._jx, this._jy, this.RADIUS, 0, Math.PI * 2);
    const gradient = context.createRadialGradient(
      this._jx,
      this._jy,
      0,
      this._jx,
      this._jy,
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

  private resetJoystick(): void {
    this.getComponent(InputComponent)!.active = false;
  }
  public override update(deltaTimeStamp: DOMHighResTimeStamp): void { super.update(deltaTimeStamp); }
}
