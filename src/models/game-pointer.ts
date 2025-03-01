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

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    if (this.isTouch() && this.isPressing() == false) {
      return;
    }

    const x = this.getX();
    const y = this.getY();

    context.fillStyle = "rgba(148, 0, 211, 0.5)";
    context.beginPath();
    context.arc(x, y, 15, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  private adjustCoordinates(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const trueX = (event.clientX - rect.left) * scaleX;
    const trueY = (event.clientY - rect.top) * scaleY;

    return { x: trueX, y: trueY };
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

        const { x, y } = this.adjustCoordinates(event);

        this.setX(x);
        this.setY(y);
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (this.preventDefault) {
          event.preventDefault();
        }

        const { x, y } = this.adjustCoordinates(event);

        this.setType(event.pointerType as PointerType);
        this.setX(x);
        this.setY(y);
        this.setInitialX(x);
        this.setInitialY(y);
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

        const { x, y } = this.adjustCoordinates(event);

        this.setX(x);
        this.setY(y);
        this.setPressing(false);
        this.setPressed(true);
      },
      { passive: false }
    );
  }
}
