import type {
  IGamePointer,
  PointerType,
} from "../interfaces/input/game-pointer.js";
import type { GamePointerTouchPoint } from "../interfaces/input/game-pointer-touch-point.js";

export class GamePointer implements IGamePointer {
  private touches: Map<number, GamePointerTouchPoint> = new Map();
  private primaryPointerId: number | null = null;
  private preventDefault: boolean = true;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.addEventListeners();
  }

  private getPrimaryTouch(): GamePointerTouchPoint | null {
    if (this.primaryPointerId === null) return null;
    return this.touches.get(this.primaryPointerId) ?? null;
  }

  public getTouchPoints(): GamePointerTouchPoint[] {
    return Array.from(this.touches.values());
  }

  public getX(): number {
    return this.getPrimaryTouch()?.x ?? -1;
  }

  public getY(): number {
    return this.getPrimaryTouch()?.y ?? -1;
  }

  public getInitialX(): number {
    return this.getPrimaryTouch()?.initialX ?? -1;
  }

  public getInitialY(): number {
    return this.getPrimaryTouch()?.initialY ?? -1;
  }


  public setPreventDefault(preventDefault: boolean): void {
    this.preventDefault = preventDefault;
  }

  public isPressing(): boolean {
    return this.getPrimaryTouch()?.pressing ?? false;
  }

  public isPressed(): boolean {
    return this.getPrimaryTouch()?.pressed ?? false;
  }

  public getType(): PointerType {
    return this.getPrimaryTouch()?.type ?? "mouse";
  }

  public isTouch(): boolean {
    return this.getPrimaryTouch()?.type === "touch";
  }

  public reset(): void {
    this.touches.clear();
    this.primaryPointerId = null;
  }

  public clearPressed(): void {
    this.touches.forEach((touch) => {
      touch.pressed = false;
    });
  }

  public renderDebugInformation(context: CanvasRenderingContext2D): void {
    this.touches.forEach((touch) => {
      if (touch.type === "touch" && !touch.pressing) {
        return;
      }

      context.fillStyle = "rgba(148, 0, 211, 0.5)";
      context.beginPath();
      context.arc(touch.x, touch.y, 15, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    });
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

        const touch = this.touches.get(event.pointerId);
        if (touch) {
          touch.x = x;
          touch.y = y;
        }
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

        const touch: GamePointerTouchPoint = {
          pointerId: event.pointerId,
          x,
          y,
          initialX: x,
          initialY: y,
          pressing: true,
          pressed: false,
          type: event.pointerType as PointerType,
        };

        this.touches.set(event.pointerId, touch);

        if (this.primaryPointerId === null) {
          this.primaryPointerId = event.pointerId;
        }
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

        const touch = this.touches.get(event.pointerId);
        if (touch) {
          touch.x = x;
          touch.y = y;
          touch.pressing = false;
          touch.pressed = true;
        }

        if (this.primaryPointerId === event.pointerId) {
          const next = Array.from(this.touches.values()).find((t) => t.pressing);
          this.primaryPointerId = next ? next.pointerId : null;
          if (next) {
            next.initialX = next.x;
            next.initialY = next.y;
          }
        }

        // remove touch if not needed
        if (touch && !touch.pressing) {
          // keep for pressed state, will clear later
        }
      },
      { passive: false }
    );
  }
}
