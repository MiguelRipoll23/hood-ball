import { BaseTappableGameEntity } from "../../../engine/entities/base-tappable-game-entity.js";

export class SmallButtonEntity extends BaseTappableGameEntity {
  private readonly FONT = "bold 15px system-ui";
  private text: string;
  private backgroundColor: string;
  private hoverColor: string;
  private textColor: string;
  private radius: number;
  private wasPressed = false;
  private disabled = false;

  constructor(
    text: string,
    width: number,
    height: number,
    backgroundColor: string = "rgba(200, 50, 50, 0.8)",
    hoverColor: string = "rgba(220, 60, 60, 0.9)",
    textColor: string = "#ffffff",
    radius: number = 20
  ) {
    super();
    this.text = text;
    this.width = width;
    this.height = height;
    this.backgroundColor = backgroundColor;
    this.hoverColor = hoverColor;
    this.textColor = textColor;
    this.radius = radius;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) {
      this.hovering = false;
      this.pressed = false;
    }
  }

  public isDisabled(): boolean {
    return this.disabled;
  }

  public override handlePointerEvent(gamePointer: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    if (this.disabled) return;
    super.handlePointerEvent(gamePointer);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    if (this.disabled) {
      super.update(delta);
      return;
    }

    if (this.pressed) {
      this.wasPressed = true;
    }
    super.update(delta);
  }

  public isButtonPressed(): boolean {
    const result = this.wasPressed;
    this.wasPressed = false;
    return result;
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    context.save();
    context.globalAlpha = this.opacity;

    if (this.disabled) {
      context.fillStyle = "rgba(180, 180, 180, 0.5)";
    } else {
      context.fillStyle = this.hovering ? this.hoverColor : this.backgroundColor;
    }

    this.drawRoundedRect(context, this.x, this.y, this.width, this.height, this.radius);
    context.fill();

    // Draw button text
    context.fillStyle = this.disabled ? "rgba(255, 255, 255, 0.5)" : this.textColor;
    context.font = this.FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      this.text,
      this.x + this.width / 2,
      this.y + this.height / 2
    );

    context.restore();
    super.render(context);
  }

  private drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
}
