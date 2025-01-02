import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { JoystickObject } from "./joystick-object.js";
import { GameKeyboard } from "../models/game-keyboard.js";
import { ObjectUtils } from "../utils/object-utils.js";

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
      if (this.gamePointer.isTouch()) {
        this.handleTouchControls();
      } else {
        this.handleKeyboardControls();
      }
    }

    ObjectUtils.fixObjectPositionIfOutOfBounds(this, this.canvas);

    this.fixPositionIfOutOfBounds();

    super.update(deltaTimeStamp);
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
    let positionFixed = false;

    // Check and fix x-coordinate if it's out of bounds
    if (this.x < 3) {
      this.x = 3;
      positionFixed = true;
    } else if (this.x > this.canvas.width - 60) {
      this.x = this.canvas.width - 60;
      positionFixed = true;
    }

    // Check and fix y-coordinate if it's out of bounds
    if (this.y < 3) {
      this.y = 3;
      positionFixed = true;
    } else if (this.y > this.canvas.height - 60) {
      this.y = this.canvas.height - 60;
      positionFixed = true;
    }

    if (positionFixed) {
      this.setSync(true);
    }
  }
}
