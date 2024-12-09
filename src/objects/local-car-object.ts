import { GameKeyboard } from "../models/game-keyboard.js";
import { GamePointer } from "../models/game-pointer.js";
import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { GearStickObject } from "./gear-stick-object.js";
import { JoystickObject } from "./joystick-object.js";
import { WorldBackgroundObject } from "./backgrounds/world-background-object.js";

export class LocalCarObject extends CarObject {
  private readonly joystickObject: JoystickObject;
  private readonly gearStickObject: GearStickObject;

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
    this.gearStickObject = new GearStickObject(
      canvas,
      gamePointer,
      gameKeyboard
    );
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

  public getGearStickObject(): GearStickObject {
    return this.gearStickObject;
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.active) {
      if (this.isCollidingWithBounds()) {
        this.gearStickObject.switchGear();
      }

      this.handleControls();
    }

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

  private isCollidingWithBounds(): boolean {
    const collidingObjects = this.getCollidingObjects();

    for (const object of collidingObjects) {
      if (object instanceof WorldBackgroundObject) {
        return true;
      }
    }

    return false;
  }

  private handleControls(): void {
    if (!this.joystickObject || !this.gearStickObject) return;

    if (this.gearStickObject.isActive()) {
      return;
    }

    const currentGear = this.gearStickObject.getCurrentGear();

    if (this.joystickObject.isActive()) {
      if (currentGear === "F" && this.speed < this.TOP_SPEED) {
        this.speed += this.ACCELERATION;
      } else if (currentGear === "R" && this.speed > -this.TOP_SPEED) {
        this.speed -= this.ACCELERATION;
      }
    } else {
      this.gearStickObject.reset();
    }

    this.angle +=
      this.HANDLING *
      (this.speed / this.TOP_SPEED) *
      this.joystickObject.getControlX();
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
