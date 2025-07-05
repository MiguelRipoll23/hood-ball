import { GamePointer } from "../../core/models/game-pointer.js";
import { EntityType } from "../enums/entity-type.js";
import { CarEntity } from "./car-entity.js";
import { JoystickEntity } from "./joystick-entity.js";
import { GameKeyboard } from "../../core/models/game-keyboard.js";
import { EntityUtils } from "../../core/utils/entity-utils.js";
import { GameGamepad } from "../../core/models/game-gamepad.js";
import { GamepadButton } from "../../core/enums/gamepad-button.js";
import { BoostButtonEntity } from "./boost-button-entity.js";

export class LocalCarEntity extends CarEntity {
  private readonly joystickEntity: JoystickEntity;
  private active = true;
  private boostButtonEntity: BoostButtonEntity | null = null;

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
    this.gamePointer = gamePointer;
    this.gameKeyboard = gameKeyboard;
    this.gameGamepad = gameGamepad;
    this.setSyncableValues();
    this.joystickEntity = new JoystickEntity(gamePointer);
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

  public getJoystickEntity(): JoystickEntity {
    return this.joystickEntity;
  }

  public setBoostButtonEntity(button: BoostButtonEntity): void {
    this.boostButtonEntity = button;
  }

  public getBoostButtonEntity(): BoostButtonEntity | null {
    return this.boostButtonEntity;
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

    if (this.active) {
      this.handleBoostInput();
    } else {
      this.deactivateBoost();
    }
    this.boostButtonEntity?.setBoostLevel(this.getBoost() / this.MAX_BOOST);

    if (this.canvas) {
      EntityUtils.fixEntityPositionIfOutOfBounds(this, this.canvas);
    }

    super.update(deltaTimeStamp);
  }

  private setSyncableValues(): void {
    this.setId(crypto.randomUUID().replaceAll("-", ""));
    this.setTypeId(EntityType.RemoteCar);
  }

  private handleTouchControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.joystickEntity.isActive()) return;

    const magnitude = this.joystickEntity.getMagnitude();
    this.accelerate(magnitude, deltaTimeStamp);

    if (this.speed != 0) {
      this.angle = this.smoothAngleTransition(
        this.angle,
        this.joystickEntity.getAngle(),
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

    const isAccelerating = this.gameGamepad.isButtonPressed(GamepadButton.R2);

    const isDecelerating = this.gameGamepad.isButtonPressed(GamepadButton.L2);

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

  private handleBoostInput(): void {
    let activating = false;

    const pressedKeys = this.gameKeyboard.getPressedKeys();

    if (pressedKeys.has("Shift") || pressedKeys.has(" ")) {
      activating = true;
    }

    if (this.boostButtonEntity) {
      const x = this.gamePointer.getX();
      const y = this.gamePointer.getY();
      if (
        this.gamePointer.isPressing() &&
        this.boostButtonEntity.containsPoint(x, y)
      ) {
        activating = true;
      }
    }

    if (this.gameGamepad.isButtonPressed(GamepadButton.R1)) {
      activating = true;
    }

    if (activating) {
      this.activateBoost();
    } else {
      this.deactivateBoost();
    }
  }
}
