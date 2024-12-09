import { BaseGameObject } from "./base/base-game-object.js";
import { GamePointer } from "../models/game-pointer.js";
import { GameKeyboard } from "../models/game-keyboard.js";

export class GearStickObject extends BaseGameObject {
  private readonly SIZE: number = 65; // Adjust size as needed
  private readonly FILL_COLOR: string = "black"; // Change fill color to black
  private readonly FONT_SIZE: number = 36; // Adjust font size as needed
  private readonly Y_OFFSET: number = 25;

  private y: number = 0;
  private x: number = 30;

  private active: boolean = false;
  private currentGear = "F";

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gamePointer: GamePointer,
    private readonly gameKeyboard: GameKeyboard
  ) {
    super();
    this.y = this.canvas.height - (this.SIZE + this.Y_OFFSET);
  }

  public override update(): void {
    this.handleTouchEvents();
    this.handleKeyboardEvents();
  }

  public render(context: CanvasRenderingContext2D): void {
    this.drawCircle(context); // Modified to draw a circle
    this.drawGearLetter(context);
  }

  public isActive(): boolean {
    return this.active;
  }

  public getCurrentGear(): string {
    return this.currentGear;
  }

  public switchGear(): void {
    this.currentGear = this.currentGear === "F" ? "R" : "F";
  }

  private drawCircle(context: CanvasRenderingContext2D): void {
    // Draw the filled circle
    context.fillStyle = this.FILL_COLOR;
    context.beginPath();
    context.arc(
      this.x + this.SIZE / 2, // x-coordinate of the center
      this.y + this.SIZE / 2, // y-coordinate of the center
      this.SIZE / 2, // radius
      0, // start angle
      Math.PI * 2 // end angle
    );
    context.closePath();
    context.fill();
  }

  private drawGearLetter(context: CanvasRenderingContext2D): void {
    // Draw the current gear letter inside the circle
    context.fillStyle = "white"; // Set text color to white
    context.font = `bold ${this.FONT_SIZE}px system-ui`; // Set font size dynamically
    context.textAlign = "center";
    context.fillText(
      this.currentGear,
      this.x + this.SIZE / 2,
      this.y + this.SIZE / 2 + 12
    );
  }

  private handleTouchEvents(): void {
    const rect = this.canvas.getBoundingClientRect();
    const touchX = this.gamePointer.getX() - rect.left;
    const touchY = this.gamePointer.getY() - rect.top;

    if (this.isWithinGearStick(touchX, touchY)) {
      this.active = true;

      if (this.gamePointer.isPressed()) {
        this.switchGear();
      }
    } else {
      this.active = false;
    }
  }

  private isWithinGearStick(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x <= this.x + this.SIZE &&
      y >= this.y &&
      y <= this.y + this.SIZE
    );
  }

  private handleKeyboardEvents(): void {
    const pressedKeys = this.gameKeyboard.getPressedKeys();

    if (pressedKeys.has("ArrowUp") || pressedKeys.has("w")) {
      this.currentGear = "F";
    } else if (pressedKeys.has("ArrowDown") || pressedKeys.has("s")) {
      this.currentGear = "R";
    }
  }
}
