import { GamepadButton } from "../enums/gamepad-button.js";
import { GameFrame } from "./game-frame.js";

export class GameGamepad {
  private gamepadIndex: number | null = null;

  constructor(private gameFrame: GameFrame) {
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
    console.log(`Gamepad connected at index ${this.gamepadIndex}`);
    this.gamepadIndex = event.gamepad.index;
    this.gameFrame.getDebugObject()?.show("Gamepad connected", 1);
  }

  private handleDisconnected(event: GamepadEvent): void {
    console.log(`Gamepad disconnected from index ${event.gamepad.index}`);

    if (this.gamepadIndex === event.gamepad.index) {
      this.gamepadIndex = null;
      this.gameFrame.getDebugObject()?.show("Gamepad disconnected", 1);
    }
  }
}
