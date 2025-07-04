import type { IGameKeyboard } from "../interfaces/input/game-keyboard.js";

export class GameKeyboard implements IGameKeyboard {
  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.addEventListeners();
  }

  public getPressedKeys(): Set<string> {
    return this.pressedKeys;
  }

  private addEventListeners(): void {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.pressedKeys.add(event.key);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }
}
