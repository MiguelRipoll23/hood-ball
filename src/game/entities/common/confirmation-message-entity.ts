import { BaseTappableGameEntity } from "../../../engine/entities/base-tappable-game-entity.js";
import type { GamePointerContract } from "../../../engine/interfaces/input/game-pointer-interface.js";

export class ConfirmationMessageEntity extends BaseTappableGameEntity {
  private readonly BOX_WIDTH = 340;
  private readonly BOX_HEIGHT = 140;
  private readonly CORNER_RADIUS = 6;
  private readonly BUTTON_WIDTH = 100;
  private readonly BUTTON_HEIGHT = 36;
  private readonly BUTTON_GAP = 15;

  private question = "";
  private isOpened = false;

  private boxX = 0;
  private boxY = 0;
  private textX = 0;
  private textY = 0;

  private confirmBtnX = 0;
  private confirmBtnY = 0;
  private cancelBtnX = 0;
  private cancelBtnY = 0;

  private confirmHovered = false;
  private cancelHovered = false;

  private confirmed = false;
  private cancelled = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super(false);
    this.opacity = 0;
  }

  public override load(): void {
    super.load();
  }

  public isOpen(): boolean {
    return this.isOpened;
  }

  public isConfirmed(): boolean {
    const result = this.confirmed;
    this.confirmed = false;
    return result;
  }

  public isCancelled(): boolean {
    const result = this.cancelled;
    this.cancelled = false;
    return result;
  }

  public show(question: string): void {
    this.question = question;
    this.isOpened = true;
    this.confirmed = false;
    this.cancelled = false;
    this.opacity = 1;
    this.setActive(true);
    this.calculateLayout();
  }

  public close(): void {
    this.isOpened = false;
    this.opacity = 0;
    this.setActive(false);
  }

  private calculateLayout(): void {
    this.boxX = this.canvas.width / 2 - this.BOX_WIDTH / 2;
    this.boxY = this.canvas.height / 2 - this.BOX_HEIGHT / 2;
    this.textX = this.canvas.width / 2;
    this.textY = this.boxY + 45;

    const buttonsY = this.boxY + this.BOX_HEIGHT - this.BUTTON_HEIGHT - 15;
    const totalW = this.BUTTON_WIDTH * 2 + this.BUTTON_GAP;
    const startX = this.canvas.width / 2 - totalW / 2;

    this.confirmBtnX = startX;
    this.confirmBtnY = buttonsY;
    this.cancelBtnX = startX + this.BUTTON_WIDTH + this.BUTTON_GAP;
    this.cancelBtnY = buttonsY;
  }

  public override handlePointerEvent(gamePointer: GamePointerContract): void {
    if (!this.isOpened || this.opacity === 0) return;

    const touches = gamePointer.getTouchPoints();

    this.confirmHovered = false;
    this.cancelHovered = false;
    this.pressed = false;
    this.hovering = false;

    if (touches.length === 0) return;

    for (const touch of touches) {
      const inConfirm = this.isPointInRect(
        touch.x, touch.y,
        this.confirmBtnX, this.confirmBtnY,
        this.BUTTON_WIDTH, this.BUTTON_HEIGHT
      );
      const inCancel = this.isPointInRect(
        touch.x, touch.y,
        this.cancelBtnX, this.cancelBtnY,
        this.BUTTON_WIDTH, this.BUTTON_HEIGHT
      );

      if (inConfirm || inCancel) {
        this.hovering = true;
        if (inConfirm) this.confirmHovered = true;
        if (inCancel) this.cancelHovered = true;

        if (touch.pressed) {
          this.pressed = true;
          this.confirmHovered = inConfirm;
          this.cancelHovered = inCancel;
          break;
        }
      }
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    if (!this.isOpened) return;

    if (this.pressed) {
      if (this.confirmHovered) {
        this.confirmed = true;
      } else if (this.cancelHovered) {
        this.cancelled = true;
      }
    }

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (!this.isOpened || this.opacity === 0) return;

    context.save();
    context.globalAlpha = this.opacity;

    this.renderBox(context);
    this.renderText(context);
    this.renderButtons(context);

    context.restore();
    super.render(context);
  }

  private renderBox(context: CanvasRenderingContext2D): void {
    const { boxX: x, boxY: y, BOX_WIDTH: w, BOX_HEIGHT: h, CORNER_RADIUS: r } = this;

    context.fillStyle = "rgba(0, 0, 0, 0.85)";
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
    context.fill();
  }

  private renderText(context: CanvasRenderingContext2D): void {
    context.font = "16px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.question, this.textX, this.textY);
  }

  private renderButtons(context: CanvasRenderingContext2D): void {
    this.renderButton(
      context,
      this.confirmBtnX, this.confirmBtnY,
      "Yes",
      this.confirmHovered ? "#27ae60" : "#2ecc71"
    );

    this.renderButton(
      context,
      this.cancelBtnX, this.cancelBtnY,
      "No",
      this.cancelHovered ? "#7f8c8d" : "#95a5a6"
    );
  }

  private renderButton(
    context: CanvasRenderingContext2D,
    x: number, y: number,
    label: string,
    color: string
  ): void {
    const w = this.BUTTON_WIDTH;
    const h = this.BUTTON_HEIGHT;
    const r = 5;

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
    context.fill();

    context.fillStyle = "white";
    context.font = "bold 15px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, x + w / 2, y + h / 2);
  }

  private isPointInRect(
    px: number, py: number,
    rx: number, ry: number,
    rw: number, rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
