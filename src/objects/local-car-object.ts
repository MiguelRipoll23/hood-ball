import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { JoystickObject } from "./joystick-object.js";
import { GameKeyboard } from "../models/game-keyboard.js";
import { ObjectUtils } from "../utils/object-utils.js";
import { GameGamepad } from "../models/game-gamepad.js";
import { GamepadMappingEnum } from "../enums/gamepad-mapping-enum.js";

export class LocalCarObject extends CarObject {
  private readonly joystickObject: JoystickObject;
  private active = true;

  constructor(
    x: number,
    y: number,
    angle: number,
    protected readonly canvas: HTMLCanvasElement,
    protected gamePointer: GamePointer,
    protected gameKeyboard: GameKeyboard,
    protected gameGamepad: GameGamepad
  ) {
    super(x, y, angle);
    this.setSyncableValues();
    this.joystickObject = new JoystickObject(canvas, gamePointer);
  }

  public override mustSync(): boolean {
    return this.speed !== 0;
  }

  public override reset(): void {
    super.reset();
    this.active = true;
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public getJoystickObject(): JoystickObject {
    return this.joystickObject;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.active) {
      if (this.gameGamepad.get()) {
        this.handleGamepadControls(deltaTimeStamp);
      } else if (this.gamePointer.isTouch()) {
        this.handleTouchControls(deltaTimeStamp);
      } else {
        this.handleKeyboardControls(deltaTimeStamp);
      }
    }

    ObjectUtils.fixObjectPositionIfOutOfBounds(this, this.canvas);

    super.update(deltaTimeStamp);
  }

  private setSyncableValues(): void {
    this.setId(crypto.randomUUID());
    this.setTypeId(ObjectType.RemoteCar);
  }

  private handleTouchControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.joystickObject.isActive()) return;

    const magnitude = this.joystickObject.getMagnitude();
    this.accelerate(magnitude, deltaTimeStamp);

    if (this.speed != 0) {
      this.angle = this.smoothAngleTransition(
        this.angle,
        this.joystickObject.getAngle(),
        deltaTimeStamp
      );
    }
  }

  private handleKeyboardControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const isAccelerating = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
    const isDecelerating = pressedKeys.has("ArrowDown") || pressedKeys.has("s");
    const isTurningLeft = pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
    const isTurningRight =
      pressedKeys.has("ArrowRight") || pressedKeys.has("d");

    if (isAccelerating && !isDecelerating) {
      this.accelerate(1, deltaTimeStamp);
    } else if (!isAccelerating && isDecelerating) {
      this.decelerate(deltaTimeStamp);
    }

    if (this.speed !== 0) {
      this.adjustAngleUsingDirection(
        isTurningLeft,
        isTurningRight,
        deltaTimeStamp
      ); // Pass deltaTimeStamp to adjust angle
    }
  }

  private handleGamepadControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    const gamepad = this.gameGamepad.get();
    if (!gamepad) return;

    const isAccelerating = this.gameGamepad.isButtonPressed(
      GamepadMappingEnum.R2
    );

    const isDecelerating = this.gameGamepad.isButtonPressed(
      GamepadMappingEnum.L2
    );

    const turnAxis = this.gameGamepad.getAxisValue(0);

    if (isAccelerating && !isDecelerating) {
      this.accelerate(1, deltaTimeStamp);
    } else if (!isAccelerating && isDecelerating) {
      this.decelerate(deltaTimeStamp);
    }

    if (this.speed !== 0) {
      this.angle += turnAxis * this.HANDLING * deltaTimeStamp;
    }

    if (this.isColliding()) {
      this.gameGamepad.vibrate(100);
    }
  }

  private accelerate(
    magnitude: number = 1,
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    if (this.speed < this.TOP_SPEED) {
      this.speed += this.ACCELERATION * magnitude * deltaTimeStamp;
    }
  }

  private decelerate(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.speed > -this.TOP_SPEED) {
      this.speed -= this.ACCELERATION * deltaTimeStamp;
    }
  }

  private adjustAngleUsingDirection(
    isTurningLeft: boolean,
    isTurningRight: boolean,
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    const direction = this.speed > 0 ? 1 : -1;

    if (isTurningLeft && !isTurningRight) {
      this.angle -= this.HANDLING * direction * deltaTimeStamp;
    } else if (!isTurningLeft && isTurningRight) {
      this.angle += this.HANDLING * direction * deltaTimeStamp;
    }
  }

  private smoothAngleTransition(
    currentAngle: number,
    targetAngle: number,
    deltaTimeStamp: DOMHighResTimeStamp
  ): number {
    currentAngle = (currentAngle + Math.PI * 2) % (Math.PI * 2);
    targetAngle = (targetAngle + Math.PI * 2) % (Math.PI * 2);

    let angleDifference = targetAngle - currentAngle;

    if (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    if (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

    return (
      currentAngle +
      Math.sign(angleDifference) *
        Math.min(Math.abs(angleDifference), this.HANDLING * deltaTimeStamp)
    );
  }
}
