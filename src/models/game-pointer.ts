export type PointerType = "mouse" | "touch" | "pen";

export class GamePointer {
  private x: number = 0;
  private y: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;

  private type: PointerType = "mouse";

  private pressing: boolean = false;
  private pressed: boolean = false;

  private preventDefault: boolean = true;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.addEventListeners();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getInitialX(): number {
    return this.initialX;
  }

  public getInitialY(): number {
    return this.initialY;
  }

  public setX(x: number): void {
    this.x = x;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public setInitialX(x: number): void {
    this.initialX = x;
  }

  public setInitialY(y: number): void {
    this.initialY = y;
  }

  public setPreventDefault(preventDefault: boolean): void {
    this.preventDefault = preventDefault;
  }

  public isPressing(): boolean {
    return this.pressing;
  }

  public setPressing(pressing: boolean): void {
    this.pressing = pressing;
  }

  public isPressed(): boolean {
    return this.pressed;
  }

  public setPressed(pressed: boolean): void {
    this.pressed = pressed;
  }

  public getType(): PointerType {
    return this.type;
  }

  public setType(type: PointerType): void {
    this.type = type;
  }

  public isTouch(): boolean {
    return this.type === "touch";
  }

  public reset(): void {
    this.x = -1;
    this.y = -1;
    this.initialX = -1;
    this.initialY = -1;
    this.pressing = false;
    this.pressed = false;
  }

  public addEventListeners(): void {
    this.canvas.addEventListener(
      "touchstart",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "touchmove",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "pointermove",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }

        this.setX(event.offsetX);
        this.setY(event.offsetY);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }

        this.setType(event.pointerType as PointerType);
        this.setX(event.offsetX);
        this.setY(event.offsetY);
        this.setInitialX(event.offsetX);
        this.setInitialY(event.offsetY);
        this.setPressing(true);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "pointerup",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }

        this.setX(event.offsetX);
        this.setY(event.offsetY);
        this.setPressing(false);
        this.setPressed(true);
      },
      { passive: false }
    );
  }
}
