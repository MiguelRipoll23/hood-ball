import { GameKeyboard } from "../models/game-keyboard.js";
import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { JoystickObject } from "./joystick-object.js";

export class LocalCarObject extends CarObject {
  private readonly joystickObject: JoystickObject;

  private active: boolean = true;

  constructor(
    x: number,
    y: number,
    angle: number,
    protected readonly canvas: HTMLCanvasElement,
    gamePointer: GamePointer,
    gameKeyboard: GameKeyboard
  ) {
    super(x, y, angle);
    this.setSyncableValues();
    this.joystickObject = new JoystickObject(canvas, gamePointer, gameKeyboard);
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public override reset(): void {
    super.reset();
    this.active = true;
  }

  public getJoystickObject(): JoystickObject {
    return this.joystickObject;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.active) {
      this.handleControls();
    }

    this.fixPositionIfOutOfBounds();

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Debug
    this.renderDebugInformation(context);

    super.render(context);
  }

  private setSyncableValues() {
    this.setId(crypto.randomUUID());
    this.setTypeId(ObjectType.RemoteCar);
  }

  private handleControls(): void {
    if (!this.joystickObject) return;

    // Handle speed based on joystick activity
    if (this.joystickObject.isActive()) {
      // Accelerate the car when joystick is in use
      if (this.speed < this.TOP_SPEED) {
        this.speed += this.ACCELERATION;
      }

      // Get the target angle from the joystick (inverted X and Y for correct control)
      const targetAngle = this.joystickObject.getAngle();

      // Smoothly transition to the target angle
      this.angle = this.smoothAngleTransition(this.angle, targetAngle);
    }
  }

  private smoothAngleTransition(
    currentAngle: number,
    targetAngle: number
  ): number {
    // Normalize the angle to the range [0, 360)
    currentAngle = (currentAngle + 360) % 360;
    targetAngle = (targetAngle + 360) % 360;

    // Calculate the difference
    let angleDifference = targetAngle - currentAngle;

    // Ensure the shortest path (between -180 and 180 degrees)
    if (angleDifference > 180) {
      angleDifference -= 360;
    } else if (angleDifference < -180) {
      angleDifference += 360;
    }

    // Smooth the transition (you can adjust the speed factor for smoother/slower transitions)
    const transitionSpeed = 5; // Increase for faster transition, decrease for slower
    const smoothedAngle =
      currentAngle +
      Math.sign(angleDifference) *
        Math.min(Math.abs(angleDifference), transitionSpeed);

    return smoothedAngle;
  }

  private fixPositionIfOutOfBounds(): void {
    if (this.x > this.canvas.width - 58) {
      this.x = this.canvas.width - 60;
    } else if (this.x < 3) {
      this.x = 20;
    }

    if (this.y > this.canvas.height - 58) {
      this.y = this.canvas.height - 60;
    } else if (this.y < 3) {
      this.y = 20;
    }
  }

  private renderDebugInformation(context: CanvasRenderingContext2D) {
    if (this.debug === false) {
      return;
    }

    this.renderDebugPositionInformation(context);
    this.renderDebugAngleInformation(context);
  }

  private renderDebugPositionInformation(context: CanvasRenderingContext2D) {
    const displayX = Math.round(this.x);
    const displayY = Math.round(this.y);

    const text = `Position: X(${displayX}) Y(${displayY})`;

    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(24, 24, 160, 20);
    context.fillStyle = "#FFFF00";
    context.font = "12px system-ui";
    context.textAlign = "left";
    context.fillText(text, 30, 38);
  }

  private renderDebugAngleInformation(context: CanvasRenderingContext2D) {
    const displayAngle = Math.round(this.angle);

    const text = `Angle: ${displayAngle}°`;

    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(24, 48, 80, 20);
    context.fillStyle = "#FFFF00";
    context.font = "12px system-ui";
    context.textAlign = "left";
    context.fillText(text, 30, 62);
  }
}
