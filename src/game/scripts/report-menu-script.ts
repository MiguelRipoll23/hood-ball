import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 450;
const TITLE_BAR_HEIGHT = 50;
const OPTION_HEIGHT = 50;
const OPTION_MARGIN = 10;
const PADDING = 20;

interface ReportOption {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hovered: boolean;
}

const REPORT_REASONS = [
  { id: "offensive_language", label: "Offensive Language" },
  { id: "inappropriate_name", label: "Inappropriate Name" },
  { id: "cheating", label: "Cheating" },
  { id: "griefing", label: "Griefing/Trolling" },
  { id: "harassment", label: "Harassment" },
];

/**
 * Script behaviour for the report-player modal. Renders the window with
 * report-reason options and confirm/cancel buttons. Implements pointer
 * hit-testing and press handling.
 * Attached to ReportMenuEntity via ScriptComponent.
 */
export class ReportMenuScript implements ScriptLifecycle {
  private canvas: HTMLCanvasElement | null = null;
  isOpened = false;
  private reportedPlayer: GamePlayer | null = null;
  private reportOptions: ReportOption[] = [];
  private selectedReason: string | null = null;
  confirmedReason: string | null = null;
  cancelled = false;

  private windowX = 0;
  private windowY = 0;

  private confirmButtonX = 0;
  private confirmButtonY = 0;
  private readonly confirmButtonWidth = 120;
  private readonly confirmButtonHeight = 40;
  confirmButtonHovered = false;

  private cancelButtonX = 0;
  private cancelButtonY = 0;
  private readonly cancelButtonWidth = 120;
  private readonly cancelButtonHeight = 40;
  cancelButtonHovered = false;

  private input!: InputComponent;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  resolveInput(input: InputComponent): void {
    this.input = input;
  }

  // ── Public API ───────────────────────────────────────────────

  open(player: GamePlayer): void {
    this.isOpened = true;
    this.reportedPlayer = player;
    this.selectedReason = null;
    this.confirmedReason = null;
    this.cancelled = false;
    this.input.active = true;
    this.calculateLayout();
  }

  close(): void {
    this.isOpened = false;
    this.reportedPlayer = null;
    this.selectedReason = null;
    this.input.active = false;
  }

  getReportedPlayer(): GamePlayer | null {
    return this.reportedPlayer;
  }

  getConfirmedReason(): string | null {
    const reason = this.confirmedReason;
    this.confirmedReason = null;
    return reason;
  }

  isCancelled(): boolean {
    const result = this.cancelled;
    this.cancelled = false;
    return result;
  }

  // ── Pointer handling ─────────────────────────────────────────

  handlePointerEvent(gamePointer: GamePointerContract): void {
    const touches = gamePointer.getTouchPoints();

    this.input.hovering = false;
    this.input.pressed = false;
    this.confirmButtonHovered = false;
    this.cancelButtonHovered = false;
    this.reportOptions.forEach((opt) => (opt.hovered = false));

    if (touches.length === 0) return;

    for (const touch of touches) {
      const isInConfirm =
        touch.x >= this.confirmButtonX &&
        touch.x <= this.confirmButtonX + this.confirmButtonWidth &&
        touch.y >= this.confirmButtonY &&
        touch.y <= this.confirmButtonY + this.confirmButtonHeight;

      const isInCancel =
        touch.x >= this.cancelButtonX &&
        touch.x <= this.cancelButtonX + this.cancelButtonWidth &&
        touch.y >= this.cancelButtonY &&
        touch.y <= this.cancelButtonY + this.cancelButtonHeight;

      let touchedOption: ReportOption | null = null;
      for (const option of this.reportOptions) {
        if (
          touch.x >= option.x && touch.x <= option.x + option.width &&
          touch.y >= option.y && touch.y <= option.y + option.height
        ) {
          touchedOption = option;
          break;
        }
      }

      const isHovering = !!(isInConfirm || isInCancel || touchedOption);

      if (isHovering) {
        this.input.hovering = true;
        if (isInConfirm) this.confirmButtonHovered = true;
        if (isInCancel) this.cancelButtonHovered = true;
        if (touchedOption) touchedOption.hovered = true;

        if (touch.pressed) {
          this.input.pressed = true;
          this.confirmButtonHovered = isInConfirm;
          this.cancelButtonHovered = isInCancel;
          this.reportOptions.forEach(
            (opt) => (opt.hovered = opt === touchedOption),
          );
          break;
        }
      }
    }
  }

  // ── ScriptLifecycle ──────────────────────────────────────────

  update(_delta: DOMHighResTimeStamp): void {
    if (this.input.pressed) {
      if (this.confirmButtonHovered && this.selectedReason) {
        this.confirmedReason = this.selectedReason;
      }
      if (this.cancelButtonHovered) {
        this.cancelled = true;
      }
      for (const option of this.reportOptions) {
        if (option.hovered) {
          this.selectedReason = option.id;
          break;
        }
      }
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isOpened) return;

    context.save();
    this.renderWindow(context);
    this.renderTitleBar(context);
    this.renderReportOptions(context);
    this.renderButtons(context);
    context.restore();
  }

  // ── Layout ───────────────────────────────────────────────────

  private calculateLayout(): void {
    const canvasWidth = this.canvas?.width || 800;
    const canvasHeight = this.canvas?.height || 600;

    this.windowX = (canvasWidth - WINDOW_WIDTH) / 2;
    this.windowY = (canvasHeight - WINDOW_HEIGHT) / 2;

    this.reportOptions = [];
    let currentY = this.windowY + TITLE_BAR_HEIGHT + PADDING;

    for (const reason of REPORT_REASONS) {
      this.reportOptions.push({
        id: reason.id,
        label: reason.label,
        x: this.windowX + PADDING,
        y: currentY,
        width: WINDOW_WIDTH - PADDING * 2,
        height: OPTION_HEIGHT,
        hovered: false,
      });
      currentY += OPTION_HEIGHT + OPTION_MARGIN;
    }

    const buttonY = Math.max(
      currentY + PADDING,
      this.windowY + WINDOW_HEIGHT - PADDING - this.confirmButtonHeight,
    );

    this.confirmButtonX =
      this.windowX + WINDOW_WIDTH - PADDING - this.confirmButtonWidth;
    this.confirmButtonY = buttonY;
    this.cancelButtonX =
      this.confirmButtonX - this.cancelButtonWidth - 10;
    this.cancelButtonY = buttonY;
  }

  // ── Rendering ────────────────────────────────────────────────

  private renderWindow(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = "#ffffff";
    this.drawRoundedRect(
      ctx, this.windowX, this.windowY, WINDOW_WIDTH, WINDOW_HEIGHT, 12,
    );
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  private renderTitleBar(ctx: CanvasRenderingContext2D): void {
    const radius = 12;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.windowX + radius, this.windowY);
    ctx.lineTo(this.windowX + WINDOW_WIDTH - radius, this.windowY);
    ctx.quadraticCurveTo(
      this.windowX + WINDOW_WIDTH, this.windowY,
      this.windowX + WINDOW_WIDTH, this.windowY + radius,
    );
    ctx.lineTo(this.windowX + WINDOW_WIDTH, this.windowY + TITLE_BAR_HEIGHT);
    ctx.lineTo(this.windowX, this.windowY + TITLE_BAR_HEIGHT);
    ctx.lineTo(this.windowX, this.windowY + radius);
    ctx.quadraticCurveTo(
      this.windowX, this.windowY,
      this.windowX + radius, this.windowY,
    );
    ctx.closePath();
    ctx.clip();

    const gradient = ctx.createLinearGradient(
      this.windowX, this.windowY,
      this.windowX, this.windowY + TITLE_BAR_HEIGHT,
    );
    gradient.addColorStop(0, "#4a90e2");
    gradient.addColorStop(1, "#357abd");
    ctx.fillStyle = gradient;
    ctx.fillRect(this.windowX, this.windowY, WINDOW_WIDTH, TITLE_BAR_HEIGHT);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const playerName = this.reportedPlayer
      ? this.reportedPlayer.getName()
      : "Player";
    ctx.fillText(
      `Report ${playerName}`,
      this.windowX + PADDING,
      this.windowY + TITLE_BAR_HEIGHT / 2,
    );
  }

  private renderReportOptions(ctx: CanvasRenderingContext2D): void {
    for (const option of this.reportOptions) {
      const isSelected = this.selectedReason === option.id;

      ctx.fillStyle = isSelected
        ? "#e74c3c"
        : option.hovered
          ? "#f5f5f5"
          : "#ffffff";
      this.drawRoundedRect(
        ctx, option.x, option.y, option.width, option.height, 5,
      );
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#c0392b" : "#dddddd";
      ctx.lineWidth = 2;
      this.drawRoundedRect(
        ctx, option.x, option.y, option.width, option.height, 5,
      );
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#ffffff" : "#333333";
      ctx.font = "18px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(option.label, option.x + 15, option.y + option.height / 2);

      if (isSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px system-ui";
        ctx.textAlign = "right";
        ctx.fillText(
          "✓", option.x + option.width - 15, option.y + option.height / 2,
        );
      }
    }
  }

  private renderButtons(ctx: CanvasRenderingContext2D): void {
    // Cancel
    const cancelColor = this.cancelButtonHovered ? "#7ed321" : "#4a90e2";
    ctx.fillStyle = cancelColor;
    this.drawRoundedRect(
      ctx, this.cancelButtonX, this.cancelButtonY,
      this.cancelButtonWidth, this.cancelButtonHeight, 5,
    );
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Cancel",
      this.cancelButtonX + this.cancelButtonWidth / 2,
      this.cancelButtonY + this.cancelButtonHeight / 2,
    );

    // Confirm
    const isConfirmEnabled = this.selectedReason !== null;
    const confirmColor = isConfirmEnabled
      ? this.confirmButtonHovered ? "#c0392b" : "#e74c3c"
      : "#cccccc";
    ctx.fillStyle = confirmColor;
    this.drawRoundedRect(
      ctx, this.confirmButtonX, this.confirmButtonY,
      this.confirmButtonWidth, this.confirmButtonHeight, 5,
    );
    ctx.fill();
    ctx.fillStyle = isConfirmEnabled ? "#ffffff" : "#999999";
    ctx.fillText(
      "Report",
      this.confirmButtonX + this.confirmButtonWidth / 2,
      this.confirmButtonY + this.confirmButtonHeight / 2,
    );
  }

  // ── Helpers ──────────────────────────────────────────────────

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
