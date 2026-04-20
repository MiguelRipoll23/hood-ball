import { BaseTappableGameEntity } from "../../../engine/entities/base-tappable-game-entity.js";
import type { GamePointerContract } from "../../../engine/interfaces/input/game-pointer-interface.js";

export class ConfirmationMessageEntity extends BaseTappableGameEntity {
  private readonly BOX_WIDTH = 300;
  private readonly BOX_HEIGHT = 160;
  private readonly CORNER_RADIUS = 8;
  private readonly BUTTON_WIDTH = 90;
  private readonly BUTTON_HEIGHT = 36;
  private readonly BUTTON_GAP = 12;
  private readonly H_PADDING = 20;
  private readonly LINE_HEIGHT = 24;

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
    this.textY = this.boxY + 40;

    const buttonsY = this.boxY + this.BOX_HEIGHT - this.BUTTON_HEIGHT - 14;
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
    context.font = "14px system-ui";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    const maxWidth = this.BOX_WIDTH - this.H_PADDING * 2;
    const lines = this.wrapText(context, this.question, maxWidth);

    const totalHeight = lines.length * this.LINE_HEIGHT;
    let startY = this.textY - (totalHeight / 2) + (this.LINE_HEIGHT / 2);

    for (const line of lines) {
      context.fillText(line, this.textX, startY, maxWidth);
      startY += this.LINE_HEIGHT;
    }
  }

  private wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const metrics = context.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private renderButtons(context: CanvasRenderingContext2D): void {
    this.renderButton(
      context,
      this.confirmBtnX, this.confirmBtnY,
      "Yes",
      this.confirmHovered ? "#22C55E" : "#3B82F6"
    );

    this.renderButton(
      context,
      this.cancelBtnX, this.cancelBtnY,
      "No",
      this.cancelHovered ? "#22C55E" : "#3B82F6"
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
    context.font = "bold 15px system-ui";
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
