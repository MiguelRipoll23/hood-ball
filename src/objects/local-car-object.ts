import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { JoystickObject } from "./joystick-object.js";
import { GameKeyboard } from "../models/game-keyboard.js";

export class LocalCarObject extends CarObject {
  private readonly joystickObject: JoystickObject;
  private active: boolean = true;

  constructor(
    x: number,
    y: number,
    angle: number,
    protected readonly canvas: HTMLCanvasElement,
    protected gamePointer: GamePointer,
    protected gameKeyboard: GameKeyboard
  ) {
    super(x, y, angle);
    this.setSyncableValues();
    this.joystickObject = new JoystickObject(canvas, gamePointer);
    this.gameKeyboard = gameKeyboard;
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
      if (this.gamePointer.isTouch()) {
        this.handleTouchControls();
      } else {
        this.handleKeyboardControls();
      }
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

  private handleTouchControls(): void {
    if (!this.joystickObject) return;

    const active = this.joystickObject.isActive();
    const magnitude = this.joystickObject.getMagnitude();

    if (active) {
      this.accelerate(magnitude);

      if (this.speed > 0) {
        const targetAngle = this.joystickObject.getAngle();
        this.angle = this.smoothAngleTransition(this.angle, targetAngle);
      }
    }
  }

  private handleKeyboardControls(): void {
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const isArrowUpPressed = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
    const isArrowDownPressed =
      pressedKeys.has("ArrowDown") || pressedKeys.has("s");
    const isArrowLeftPressed =
      pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
    const isArrowRightPressed =
      pressedKeys.has("ArrowRight") || pressedKeys.has("d");

    if (isArrowUpPressed && !isArrowDownPressed) {
      this.accelerate();
    } else if (!isArrowUpPressed && isArrowDownPressed) {
      this.decelerate();
    }

    if (this.speed === 0) {
      return;
    }

    if (isArrowLeftPressed && !isArrowRightPressed) {
      if (this.speed > 0) {
        this.angle -= this.HANDLING;
      } else {
        this.angle += this.HANDLING;
      }
    } else if (!isArrowLeftPressed && isArrowRightPressed) {
      if (this.speed > 0) {
        this.angle += this.HANDLING;
      } else {
        this.angle -= this.HANDLING;
      }
    }
  }

  private accelerate(magnitude = 1): void {
    if (this.speed < this.TOP_SPEED) {
      this.speed += this.ACCELERATION * magnitude;
    }
  }

  private decelerate(): void {
    if (this.speed > -this.TOP_SPEED) {
      this.speed -= this.ACCELERATION;
    }
  }

  private smoothAngleTransition(
    currentAngle: number,
    targetAngle: number
  ): number {
    // Normalize the angle to the range [0, 2π)
    currentAngle = (currentAngle + Math.PI * 2) % (Math.PI * 2);
    targetAngle = (targetAngle + Math.PI * 2) % (Math.PI * 2);

    // Calculate the difference
    let angleDifference = targetAngle - currentAngle;

    // Ensure the shortest path (between -π and π)
    if (angleDifference > Math.PI) {
      angleDifference -= Math.PI * 2;
    } else if (angleDifference < -Math.PI) {
      angleDifference += Math.PI * 2;
    }

    // Smooth the transition (you can adjust the speed factor for smoother/slower transitions)
    const transitionSpeed = 0.1; // Increase for faster transition, decrease for slower
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
    const degrees = (this.angle * 180) / Math.PI;
    const displayAngle = degrees.toFixed(0);

    const text = `Angle: ${displayAngle}°`;

    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(24, 48, 80, 20);
    context.fillStyle = "#FFFF00";
    context.font = "12px system-ui";
    context.textAlign = "left";
    context.fillText(text, 30, 62);
  }
}
