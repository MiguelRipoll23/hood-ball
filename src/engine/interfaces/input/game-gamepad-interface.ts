import type { GamepadButton } from "../../enums/gamepad-button.js";

export interface GameGamepadContract {
  get(): Gamepad | null;
  isButtonPressed(button: GamepadButton): boolean;
  getAxisValue(axisIndex: number): number;
  vibrate(duration: number): void;
}
