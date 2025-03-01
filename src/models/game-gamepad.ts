import { GamepadMappingConstants } from "../constants/gamepad-mapping-constants.js";
import { GamepadMappingEnum } from "../enums/gamepad-mapping-enum.js";

export class GameGamepad {
  private gamepadIndex: number | null = null;

  constructor() {
    window.addEventListener("gamepadconnected", this.onGamepadConnected.bind(this));
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected.bind(this));
  }

  private onGamepadConnected(event: GamepadEvent): void {
    this.gamepadIndex = event.gamepad.index;
    console.log(`Gamepad connected at index ${this.gamepadIndex}`);
  }

  private onGamepadDisconnected(event: GamepadEvent): void {
    if (this.gamepadIndex === event.gamepad.index) {
      this.gamepadIndex = null;
      console.log(`Gamepad disconnected from index ${event.gamepad.index}`);
    }
  }

  public getGamepad(): Gamepad | null {
    if (this.gamepadIndex !== null) {
      return navigator.getGamepads()[this.gamepadIndex];
    }
    return null;
  }

  public isButtonPressed(button: GamepadMappingEnum): boolean {
    const gamepad = this.getGamepad();
    return gamepad ? gamepad.buttons[button].pressed : false;
  }

  public getAxisValue(axisIndex: number): number {
    const gamepad = this.getGamepad();
    return gamepad ? gamepad.axes[axisIndex] : 0;
  }
}
