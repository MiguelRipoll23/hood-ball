import type { GameKeyboardContract } from "../interfaces/input/game-keyboard-interface.js";

export class GameKeyboard implements GameKeyboardContract {
  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.addEventListeners();
  }

  public getPressedKeys(): Set<string> {
    return this.pressedKeys;
  }

  private addEventListeners(): void {
    globalThis.addEventListener("keydown", this.handleKeyDown.bind(this));
    globalThis.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.pressedKeys.add(event.key);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }
}
