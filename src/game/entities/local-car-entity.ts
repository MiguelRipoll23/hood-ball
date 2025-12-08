import { GamePointer } from "../../core/models/game-pointer.js";
import { EntityType } from "../enums/entity-type.js";
import { CarEntity } from "./car-entity.js";
import { JoystickEntity } from "./joystick-entity.js";
import { GameKeyboard } from "../../core/models/game-keyboard.js";
import { EntityUtils } from "../../core/utils/entity-utils.js";
import { GameGamepad } from "../../core/models/game-gamepad.js";
import { GamepadButton } from "../../core/enums/gamepad-button.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatButtonEntity } from "./chat-button-entity.js";

export class LocalCarEntity extends CarEntity {
  private readonly joystickEntity: JoystickEntity;
  private active = true;
  private boostMeterEntity: BoostMeterEntity | null = null;
  private chatButtonEntity: ChatButtonEntity | null = null;

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
    return super.mustSync() || this.speed !== 0;
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

  public setBoostMeterEntity(meter: BoostMeterEntity): void {
    this.boostMeterEntity = meter;
  }

  public getBoostMeterEntity(): BoostMeterEntity | null {
    return this.boostMeterEntity;
  }

  public setChatButtonEntity(chatButton: ChatButtonEntity): void {
    this.chatButtonEntity = chatButton;
  }

  private canProcessInput(): boolean {
    const isChatActive = this.chatButtonEntity?.isInputVisible() ?? false;
    return this.active && !isChatActive;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.canProcessInput()) {
      if (this.gameGamepad.get()) {
        this.handleGamepadControls(deltaTimeStamp);
      } else if (this.gamePointer.isTouch()) {
        this.handleTouchControls(deltaTimeStamp);
      } else {
        this.handleKeyboardControls(deltaTimeStamp);
      }
    }

    if (this.canProcessInput()) {
      this.handleBoostInput();
    } else {
      this.deactivateBoost();
    }

    super.update(deltaTimeStamp);

    if (this.canvas) {
      EntityUtils.fixEntityPositionIfOutOfBounds(this, this.canvas);
    }

    this.boostMeterEntity?.setBoostLevel(this.getBoost() / this.MAX_BOOST);
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
    if (this.speed < this.topSpeed) {
      this.speed += this.acceleration * magnitude * deltaTimeStamp;
    }
  }

  private decelerate(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.speed > -this.topSpeed) {
      this.speed -= this.acceleration * deltaTimeStamp;
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
    let attemptingWhileEmpty = false;

    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const spacePressed = pressedKeys.has(" ");
    if (pressedKeys.has("Shift") || spacePressed) {
      activating = true;
      if (spacePressed && this.getBoost() === 0) {
        attemptingWhileEmpty = true;
      }
    }

    if (this.boostMeterEntity) {
      const touches = this.gamePointer.getTouchPoints();
      const twoFingers = touches.filter((t) => t.pressing).length >= 2;
      if (twoFingers) {
        activating = true;
        if (this.getBoost() === 0) {
          attemptingWhileEmpty = true;
        }
      }
      this.boostMeterEntity.setAttemptingBoostWhileEmpty(attemptingWhileEmpty);
    }

    if (this.gameGamepad.isButtonPressed(GamepadButton.R1)) {
      activating = true;
    }

    if (activating) {
      this.activateBoost();
    } else {
      this.deactivateBoost();
      this.boostMeterEntity?.setAttemptingBoostWhileEmpty(false);
    }
  }
}
