import type { IGameKeyboard } from "../interfaces/input/game-keyboard.js";

export class GameKeyboard implements IGameKeyboard {
  private pressedKeys: Set<string> = new Set();
  private enabled = true;

  constructor() {
    this.addEventListeners();
  }

  public getPressedKeys(): Set<string> {
    return this.pressedKeys;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressedKeys.clear();
    }
  }

  private addEventListeners(): void {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.enabled) {
      this.pressedKeys.add(event.key);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.enabled) {
      this.pressedKeys.delete(event.key);
    }
  }
}
