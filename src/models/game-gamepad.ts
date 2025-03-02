import { GamepadButton } from "../enums/gamepad-button.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class GameGamepad {
  private gamepadIndex: number | null = null;

  constructor() {
    this.addEventListeners();
  }

  public get(): Gamepad | null {
    if (this.gamepadIndex !== null) {
      return navigator.getGamepads()[this.gamepadIndex];
    }

    return null;
  }

  public isButtonPressed(button: GamepadButton): boolean {
    return this.get()?.buttons[button]?.pressed ?? false;
  }

  public getAxisValue(axisIndex: number): number {
    return this.get()?.axes[axisIndex] ?? 0;
  }

  public vibrate(duration: number): void {
    this.get()?.vibrationActuator?.playEffect("dual-rumble", {
      duration,
      strongMagnitude: 1.0,
      weakMagnitude: 1.0,
    });
  }

  private addEventListeners(): void {
    window.addEventListener(
      "gamepadconnected",
      this.handleConnected.bind(this)
    );

    window.addEventListener(
      "gamepaddisconnected",
      this.handleDisconnected.bind(this)
    );
  }

  private handleConnected(event: GamepadEvent): void {
    this.gamepadIndex = event.gamepad.index;
    console.log(`Gamepad connected at index ${this.gamepadIndex}`);
  }

  private handleDisconnected(event: GamepadEvent): void {
    if (this.gamepadIndex === event.gamepad.index) {
      this.gamepadIndex = null;
      console.log(`Gamepad disconnected from index ${event.gamepad.index}`);
    }
  }
}
