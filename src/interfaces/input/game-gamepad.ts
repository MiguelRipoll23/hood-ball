import type { GamepadButton } from "../../enums/gamepad-button.js";

export interface IGameGamepad {
  get(): Gamepad | null;
  isButtonPressed(button: GamepadButton): boolean;
  getAxisValue(axisIndex: number): number;
  vibrate(duration: number): void;
}
