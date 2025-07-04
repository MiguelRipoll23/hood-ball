export type PointerType = "mouse" | "touch" | "pen";

export interface IGamePointer {
  getX(): number;
  getY(): number;
  getInitialX(): number;
  getInitialY(): number;
  setX(x: number): void;
  setY(y: number): void;
  setInitialX(x: number): void;
  setInitialY(y: number): void;
  setPreventDefault(preventDefault: boolean): void;
  isPressing(): boolean;
  setPressing(pressing: boolean): void;
  isPressed(): boolean;
  setPressed(pressed: boolean): void;
  getType(): PointerType;
  setType(type: PointerType): void;
  isTouch(): boolean;
  reset(): void;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
