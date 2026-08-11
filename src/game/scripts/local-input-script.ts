import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import type { GameGamepadContract } from "../../engine/interfaces/input/game-gamepad-interface.js";
import { JoystickEntity } from "../entities/joystick-entity.js";
import { GamepadButton } from "../../engine/enums/gamepad-button.js";
import { EntityUtils, type MoveableEntity } from "../../engine/utils/entity-utils.js";
import type { BoostMeterEntity } from "../entities/boost-meter-entity.js";
import type { ChatButtonEntity } from "../entities/chat-button-entity.js";
import type { CarEntity } from "../entities/car-entity.js";

/**
 * Local input script. Runs before CarScript (priority -1) to read
 * keyboard/touch/gamepad input and set speed/angle/boosting that
 * CarScript will then consume.
 */
export class LocalInputScript implements ScriptLifecycle {
  // ── References ────────────────────────────────────────────────
  private entity!: CarEntity;
  private readonly joystickEntity: JoystickEntity | null;
  private gamePointer?: GamePointerContract;
  private gameKeyboard?: GameKeyboardContract;
  private gameGamepad?: GameGamepadContract;
  private boostMeterEntity: BoostMeterEntity | null = null;
  private chatButtonEntity: ChatButtonEntity | null = null;

  // ── State ─────────────────────────────────────────────────────
  inputActive = true;

  constructor(
    gamePointer?: GamePointerContract,
    gameKeyboard?: GameKeyboardContract,
    gameGamepad?: GameGamepadContract,
  ) {
    this.gamePointer = gamePointer;
    this.gameKeyboard = gameKeyboard;
    this.gameGamepad = gameGamepad;
    this.joystickEntity = gamePointer ? new JoystickEntity(gamePointer) : null;
  }

  resolveEntity(entity: CarEntity): void {
    this.entity = entity;
  }

  getJoystickEntity(): JoystickEntity | null { return this.joystickEntity; }

  setBoostMeterEntity(meter: BoostMeterEntity): void { this.boostMeterEntity = meter; }
  getBoostMeterEntity(): BoostMeterEntity | null { return this.boostMeterEntity; }

  setChatButtonEntity(chatButton: ChatButtonEntity): void {
    this.chatButtonEntity = chatButton;
  }

  private canProcessInput(): boolean {
    const isChatActive = this.chatButtonEntity?.isInputVisible() ?? false;
    return this.inputActive && !isChatActive;
  }

  // ── ScriptLifecycle ───────────────────────────────────────────

  update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.canProcessInput()) {
      if (this.gameGamepad!.get()) {
        this.handleGamepadControls(deltaTimeStamp);
      } else if (this.gamePointer!.isTouch()) {
        this.handleTouchControls(deltaTimeStamp);
      } else {
        this.handleKeyboardControls(deltaTimeStamp);
      }
    }

    if (this.canProcessInput()) {
      this.handleBoostInput();
    } else {
      this.entity.deactivateBoost();
    }

    // Bounds safety
    const canvas = this.entity.getCanvas();
    if (canvas) {
      EntityUtils.fixEntityPositionIfOutOfBounds(this.entity as unknown as MoveableEntity, canvas);
    }

    this.boostMeterEntity?.setBoostLevel(
      this.entity.getBoost() / this.entity.getMaxBoost(),
    );
  }

  reset(): void {
    this.inputActive = true;
  }

  // ── Input handling ────────────────────────────────────────────

  private handleTouchControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.joystickEntity || !this.joystickEntity.isActive()) return;

    const magnitude = this.joystickEntity.getMagnitude();
    this.accelerate(magnitude, deltaTimeStamp);

    if (this.entity.getSpeed() !== 0) {
      const newAngle = this.smoothAngleTransition(
        this.entity.getAngle(),
        this.joystickEntity.getAngle(),
        deltaTimeStamp,
      );
      this.entity.setAngle(newAngle);
    }
  }

  private handleKeyboardControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.gameKeyboard) return;
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    const isAccelerating = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
    const isDecelerating = pressedKeys.has("ArrowDown") || pressedKeys.has("s");
    const isTurningLeft = pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
    const isTurningRight = pressedKeys.has("ArrowRight") || pressedKeys.has("d");

    if (isAccelerating && !isDecelerating) {
      this.accelerate(1, deltaTimeStamp);
    } else if (!isAccelerating && isDecelerating) {
      this.decelerate(deltaTimeStamp);
    }

    if (this.entity.getSpeed() !== 0) {
      this.adjustAngleUsingDirection(isTurningLeft, isTurningRight, deltaTimeStamp);
    }
  }

  private handleGamepadControls(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this.gameGamepad) return;
    const gamepad = this.gameGamepad.get();
    if (!gamepad) return;

    if (this.gameGamepad.isButtonPressed(GamepadButton.R2)) {
      this.accelerate(1, deltaTimeStamp);
    } else if (this.gameGamepad.isButtonPressed(GamepadButton.L2)) {
      this.decelerate(deltaTimeStamp);
    }

    const turnAxis = this.gameGamepad.getAxisValue(0);
    if (this.entity.getSpeed() !== 0) {
      this.entity.setAngle(
        this.entity.getAngle() + turnAxis * this.entity.getHandling() * deltaTimeStamp,
      );
    }

    if (this.entity.isColliding()) {
      this.gameGamepad.vibrate(100);
    }
  }

  private accelerate(magnitude: number, delta: DOMHighResTimeStamp): void {
    if (this.entity.getSpeed() < this.entity.getTopSpeed()) {
      this.entity.setSpeed(
        this.entity.getSpeed() + this.entity.getAcceleration() * magnitude * delta,
      );
    }
  }

  private decelerate(delta: DOMHighResTimeStamp): void {
    if (this.entity.getSpeed() > -this.entity.getTopSpeed()) {
      this.entity.setSpeed(
        this.entity.getSpeed() - this.entity.getAcceleration() * delta,
      );
    }
  }

  private adjustAngleUsingDirection(
    isTurningLeft: boolean,
    isTurningRight: boolean,
    delta: DOMHighResTimeStamp,
  ): void {
    const direction = this.entity.getSpeed() > 0 ? 1 : -1;
    if (isTurningLeft && !isTurningRight) {
      this.entity.setAngle(
        this.entity.getAngle() - this.entity.getHandling() * direction * delta,
      );
    } else if (!isTurningLeft && isTurningRight) {
      this.entity.setAngle(
        this.entity.getAngle() + this.entity.getHandling() * direction * delta,
      );
    }
  }

  private smoothAngleTransition(
    currentAngle: number,
    targetAngle: number,
    delta: DOMHighResTimeStamp,
  ): number {
    currentAngle = (currentAngle + Math.PI * 2) % (Math.PI * 2);
    targetAngle = (targetAngle + Math.PI * 2) % (Math.PI * 2);

    let angleDifference = targetAngle - currentAngle;
    if (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    if (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

    return (
      currentAngle +
      Math.sign(angleDifference) *
        Math.min(Math.abs(angleDifference), this.entity.getHandling() * delta)
    );
  }

  private handleBoostInput(): void {
    if (!this.gameKeyboard || !this.gamePointer || !this.gameGamepad) return;

    let activating = false;
    let attemptingWhileEmpty = false;

    const pressedKeys = this.gameKeyboard.getPressedKeys();
    const spacePressed = pressedKeys.has(" ");

    if (pressedKeys.has("Shift") || spacePressed) {
      activating = true;
      if (spacePressed && this.entity.getBoost() === 0) {
        attemptingWhileEmpty = true;
      }
    }

    if (this.boostMeterEntity) {
      const touches = this.gamePointer.getTouchPoints();
      if (touches.filter((t) => t.pressing).length >= 2) {
        activating = true;
        if (this.entity.getBoost() === 0) {
          attemptingWhileEmpty = true;
        }
      }
      this.boostMeterEntity.setAttemptingBoostWhileEmpty(attemptingWhileEmpty);
    }

    if (this.gameGamepad.isButtonPressed(GamepadButton.R1)) {
      activating = true;
    }

    if (activating) {
      this.entity.activateBoost();
    } else {
      this.entity.deactivateBoost();
      this.boostMeterEntity?.setAttemptingBoostWhileEmpty(false);
    }
  }
}
