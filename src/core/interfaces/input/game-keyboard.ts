export interface IGameKeyboard {
  getPressedKeys(): Set<string>;
  setEnabled(enabled: boolean): void;
}
