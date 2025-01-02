import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { JoystickObject } from "./joystick-object.js";
import { GameKeyboard } from "../models/game-keyboard.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class LocalCarObject extends CarObject {
  private readonly joystickObject: JoystickObject;
  private active = true;

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
    if (this.debug) this.renderDebugInformation(context);
    super.render(context);
  }

  private setSyncableValues(): void {
    this.setId(crypto.randomUUID());
    this.setTypeId(ObjectType.RemoteCar);
  }

  private handleTouchControls(): void {
    if (!this.joystickObject.isActive()) return;

    const magnitude = this.joystickObject.getMagnitude();
    this.accelerate(magnitude);

    if (this.speed != 0) {
      this.angle = this.smoothAngleTransition(
        this.angle,
        this.joystickObject.getAngle()
      );
    }
  }

  private handleKeyboardControls(): void {
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const isAccelerating = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
    const isDecelerating = pressedKeys.has("ArrowDown") || pressedKeys.has("s");
    const isTurningLeft = pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
    const isTurningRight =
      pressedKeys.has("ArrowRight") || pressedKeys.has("d");

    if (isAccelerating && !isDecelerating) {
      this.accelerate();
    } else if (!isAccelerating && isDecelerating) {
      this.decelerate();
    }

    if (this.speed !== 0) {
      this.adjustAngle(isTurningLeft, isTurningRight);
    }
  }

  private adjustAngle(isTurningLeft: boolean, isTurningRight: boolean): void {
    const direction = this.speed > 0 ? 1 : -1;

    if (isTurningLeft && !isTurningRight) {
      this.angle -= this.HANDLING * direction;
    } else if (!isTurningLeft && isTurningRight) {
      this.angle += this.HANDLING * direction;
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
    currentAngle = (currentAngle + Math.PI * 2) % (Math.PI * 2);
    targetAngle = (targetAngle + Math.PI * 2) % (Math.PI * 2);

    let angleDifference = targetAngle - currentAngle;

    if (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    if (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

    return (
      currentAngle +
      Math.sign(angleDifference) * Math.min(Math.abs(angleDifference), 0.1)
    );
  }

  private fixPositionIfOutOfBounds(): void {
    this.x = Math.max(3, Math.min(this.x, this.canvas.width - 60));
    this.y = Math.max(3, Math.min(this.y, this.canvas.height - 60));
    this.setSync(true);
  }

  private renderDebugInformation(context: CanvasRenderingContext2D): void {
    if (this.getPlayer()?.isHost()) {
      DebugUtils.renderDebugText(context, 24, 48, "Host");
    } else {
      const pingTime = this.getPlayer()?.getPingTime();
      const displayPingTime = pingTime === null ? "n/a" : `${pingTime} ms`;
      DebugUtils.renderDebugText(context, 24, 48, `Ping: ${displayPingTime}`);
    }
  }
}
