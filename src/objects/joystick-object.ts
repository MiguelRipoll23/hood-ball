import { BaseGameObject } from "./base/base-game-object.js";
import { GamePointer } from "../models/game-pointer.js";
import { GameKeyboard } from "../models/game-keyboard.js";

export class JoystickObject extends BaseGameObject {
  private readonly RADIUS: number = 40;
  private readonly MAX_DISTANCE: number = 30;

  private active: boolean = false;
  private controlX: number = 0;
  private controlY: number = 0;

  private x: number = 0;
  private y: number = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gamePointer: GamePointer,
    private readonly gameKeyboard: GameKeyboard
  ) {
    super();
  }

  public override update() {
    if (this.gamePointer.isTouch()) {
      this.handleGamePointerEvents();
      this.updateJoystickPosition();

      if (this.debug && this.gamePointer.isPressing() === false) {
        this.handleKeyboardEvents();
      }
    } else {
      this.handleKeyboardEvents();
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
      this.resetJoystick();
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

    this.calculateControlValues();
  }

  private calculateDistance(): number {
    return Math.sqrt(
      Math.pow(this.gamePointer.getX() - this.gamePointer.getInitialX(), 2) +
        Math.pow(this.gamePointer.getY() - this.gamePointer.getInitialY(), 2)
    );
  }

  private adjustPosition() {
    const angle = Math.atan2(
      this.gamePointer.getY() - this.gamePointer.getInitialY(),
      this.gamePointer.getX() - this.gamePointer.getInitialX()
    );
    const newX =
      this.gamePointer.getInitialX() + this.MAX_DISTANCE * Math.cos(angle);
    const newY =
      this.gamePointer.getInitialY() + this.MAX_DISTANCE * Math.sin(angle);
    this.x = newX;
    this.y = newY;
  }

  private calculateControlValues() {
    const relativeX = this.x - this.gamePointer.getInitialX();
    const relativeY = this.y - this.gamePointer.getInitialY();

    this.controlX = relativeX / this.MAX_DISTANCE;
    this.controlY = relativeY / this.MAX_DISTANCE;
  }

  public isActive() {
    return this.active;
  }

  public getControlX() {
    return this.controlX;
  }

  public getControlY() {
    return this.controlY;
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
    context.lineWidth = 2; // Adjust line width as needed
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
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 10;

    context.fill();

    // Restore the previous state
    context.restore();

    context.closePath();
  }

  private handleKeyboardEvents() {
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const isArrowUpPressed = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
    const isArrowDownPressed =
      pressedKeys.has("ArrowDown") || pressedKeys.has("s");
    const isArrowLeftPressed =
      pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
    const isArrowRightPressed =
      pressedKeys.has("ArrowRight") || pressedKeys.has("d");

    this.active = isArrowUpPressed || isArrowDownPressed;

    if (isArrowUpPressed && !isArrowDownPressed) {
      this.controlY = -1;
    } else if (!isArrowUpPressed && isArrowDownPressed) {
      this.controlY = 1;
    } else {
      this.controlY = 0;
    }

    if (isArrowLeftPressed && !isArrowRightPressed) {
      this.controlX = -1;
    } else if (!isArrowLeftPressed && isArrowRightPressed) {
      this.controlX = 1;
    } else {
      this.controlX = 0;
    }
  }

  private resetJoystick() {
    this.active = false;
    this.controlX = 0;
    this.controlY = 0;
  }
}
