import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";
import type { GamePlayer } from "../models/game-player.js";
import type { BanOption } from "../interfaces/ui/ban-option.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 500;
const TITLE_BAR_HEIGHT = 50;
const OPTION_HEIGHT = 40;
const OPTION_MARGIN = 10;
const PADDING = 20;

interface DurationUnitDef {
  value: "minutes" | "hours" | "days" | "weeks" | "months" | "years";
  label: string;
}

const DURATION_UNITS: DurationUnitDef[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

const BAN_REASONS = [
  { id: "offensive_language", label: "Offensive Language" },
  { id: "inappropriate_name", label: "Inappropriate Name" },
  { id: "cheating", label: "Cheating" },
  { id: "griefing", label: "Griefing/Trolling" },
  { id: "harassment", label: "Harassment" },
];

/**
 * Script behaviour for the ban-player modal. Renders the window with
 * ban-reason options, duration controls, permanent checkbox, and
 * confirm/cancel buttons. Implements pointer hit-testing and press handling.
 * Attached to BanMenuEntity via ScriptComponent.
 */
export class BanMenuScript implements ScriptLifecycle {
  private canvas: HTMLCanvasElement | null = null;
  isOpened = false;
  private bannedPlayer: GamePlayer | null = null;
  private banOptions: BanOption[] = [];
  private selectedReason: string | null = null;

  // Duration state
  private durationValue = 1;
  private durationUnitIndex = 0;
  isPermanent = false;

  // Confirmed result
  confirmedData: {
    reason: string;
    duration?: { value: number; unit: string };
  } | null = null;

  cancelled = false;

  private windowX = 0;
  private windowY = 0;

  // Button hit areas (set by calculateLayout)
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

  // Duration controls
  private durationContainerY = 0;
  private decreaseValueBtnX = 0;
  private decreaseValueBtnY = 0;
  private readonly decreaseValueBtnSize = 30;
  decreaseValueBtnHovered = false;
  private increaseValueBtnX = 0;
  private increaseValueBtnY = 0;
  private readonly increaseValueBtnSize = 30;
  increaseValueBtnHovered = false;
  private unitBtnX = 0;
  private unitBtnY = 0;
  private readonly unitBtnWidth = 100;
  private readonly unitBtnHeight = 30;
  unitBtnHovered = false;
  private permanentCheckboxX = 0;
  private permanentCheckboxY = 0;
  private readonly permanentCheckboxSize = 20;
  permanentCheckboxHovered = false;

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
    this.bannedPlayer = player;
    this.selectedReason = null;
    this.confirmedData = null;
    this.cancelled = false;
    this.input.active = true;
    this.durationValue = 1;
    this.durationUnitIndex = 0;
    this.isPermanent = false;
    this.calculateLayout();
  }

  close(): void {
    this.isOpened = false;
    this.bannedPlayer = null;
    this.selectedReason = null;
    this.input.active = false;
  }

  getBannedPlayer(): GamePlayer | null {
    return this.bannedPlayer;
  }

  getConfirmedData(): {
    reason: string;
    duration?: { value: number; unit: string };
  } | null {
    const data = this.confirmedData;
    this.confirmedData = null;
    return data;
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
    this.decreaseValueBtnHovered = false;
    this.increaseValueBtnHovered = false;
    this.unitBtnHovered = false;
    this.permanentCheckboxHovered = false;
    this.banOptions.forEach((opt) => (opt.hovered = false));

    if (touches.length === 0) return;

    for (const touch of touches) {
      const isInConfirm = this.isPointInRect(
        touch.x, touch.y,
        this.confirmButtonX, this.confirmButtonY,
        this.confirmButtonWidth, this.confirmButtonHeight,
      );
      const isInCancel = this.isPointInRect(
        touch.x, touch.y,
        this.cancelButtonX, this.cancelButtonY,
        this.cancelButtonWidth, this.cancelButtonHeight,
      );

      let isInDecrease = false;
      let isInIncrease = false;
      let isInUnit = false;

      if (!this.isPermanent) {
        isInDecrease = this.isPointInRect(
          touch.x, touch.y,
          this.decreaseValueBtnX, this.decreaseValueBtnY,
          this.decreaseValueBtnSize, this.decreaseValueBtnSize,
        );
        isInIncrease = this.isPointInRect(
          touch.x, touch.y,
          this.increaseValueBtnX, this.increaseValueBtnY,
          this.increaseValueBtnSize, this.increaseValueBtnSize,
        );
        isInUnit = this.isPointInRect(
          touch.x, touch.y,
          this.unitBtnX, this.unitBtnY,
          this.unitBtnWidth, this.unitBtnHeight,
        );
      }

      const isInCheckbox = this.isPointInRect(
        touch.x, touch.y,
        this.permanentCheckboxX, this.permanentCheckboxY,
        this.permanentCheckboxSize + 100, this.permanentCheckboxSize,
      );

      let touchedOption: BanOption | null = null;
      for (const option of this.banOptions) {
        if (this.isPointInRect(touch.x, touch.y, option.x, option.y, option.width, option.height)) {
          touchedOption = option;
          break;
        }
      }

      const isHovering = !!(
        isInConfirm || isInCancel || isInDecrease || isInIncrease ||
        isInUnit || isInCheckbox || touchedOption
      );

      if (isHovering) {
        this.input.hovering = true;
        if (isInConfirm) this.confirmButtonHovered = true;
        if (isInCancel) this.cancelButtonHovered = true;
        if (isInDecrease) this.decreaseValueBtnHovered = true;
        if (isInIncrease) this.increaseValueBtnHovered = true;
        if (isInUnit) this.unitBtnHovered = true;
        if (isInCheckbox) this.permanentCheckboxHovered = true;
        if (touchedOption) touchedOption.hovered = true;

        if (touch.pressed) {
          this.input.pressed = true;
          this.confirmButtonHovered = isInConfirm;
          this.cancelButtonHovered = isInCancel;
          this.decreaseValueBtnHovered = isInDecrease;
          this.increaseValueBtnHovered = isInIncrease;
          this.unitBtnHovered = isInUnit;
          this.permanentCheckboxHovered = isInCheckbox;
          this.banOptions.forEach((opt) => (opt.hovered = opt === touchedOption));
          break;
        }
      }
    }
  }

  // ── ScriptLifecycle ──────────────────────────────────────────

  update(_delta: DOMHighResTimeStamp): void {
    if (this.input.pressed) {
      if (this.confirmButtonHovered && this.selectedReason) {
        this.confirmedData = {
          reason: this.selectedReason,
          duration: this.isPermanent ? undefined : {
            value: this.durationValue,
            unit: DURATION_UNITS[this.durationUnitIndex].value,
          },
        };
      } else if (this.cancelButtonHovered) {
        this.cancelled = true;
      } else if (this.decreaseValueBtnHovered && this.durationValue > 1) {
        this.durationValue--;
      } else if (this.increaseValueBtnHovered) {
        this.durationValue++;
      } else if (this.unitBtnHovered) {
        this.durationUnitIndex =
          (this.durationUnitIndex + 1) % DURATION_UNITS.length;
      } else if (this.permanentCheckboxHovered) {
        this.isPermanent = !this.isPermanent;
      }

      for (const option of this.banOptions) {
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
    this.renderBanOptions(context);
    this.renderDurationSection(context);
    this.renderButtons(context);
    context.restore();
  }

  // ── Layout ───────────────────────────────────────────────────

  private calculateLayout(): void {
    const canvasWidth = this.canvas?.width || 800;
    const canvasHeight = this.canvas?.height || 600;

    this.windowX = (canvasWidth - WINDOW_WIDTH) / 2;
    this.windowY = (canvasHeight - WINDOW_HEIGHT) / 2;

    this.banOptions = [];
    let currentY = this.windowY + TITLE_BAR_HEIGHT + PADDING;

    for (const reason of BAN_REASONS) {
      this.banOptions.push({
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

    this.durationContainerY = currentY + 10;
    this.permanentCheckboxX = this.windowX + PADDING;
    this.permanentCheckboxY = this.durationContainerY + 30;

    const controlsY = this.permanentCheckboxY + this.permanentCheckboxSize + 15;
    this.decreaseValueBtnX = this.windowX + PADDING;
    this.decreaseValueBtnY = controlsY;
    this.increaseValueBtnX = this.windowX + PADDING + 80;
    this.increaseValueBtnY = controlsY;
    this.unitBtnX = this.increaseValueBtnX + this.increaseValueBtnSize + 10;
    this.unitBtnY = controlsY;

    const buttonY =
      this.windowY + WINDOW_HEIGHT - PADDING - this.confirmButtonHeight;
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
    this.drawRoundedRect(ctx, this.windowX, this.windowY, WINDOW_WIDTH, WINDOW_HEIGHT, 12);
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
    gradient.addColorStop(0, "#e74c3c");
    gradient.addColorStop(1, "#c0392b");
    ctx.fillStyle = gradient;
    ctx.fillRect(this.windowX, this.windowY, WINDOW_WIDTH, TITLE_BAR_HEIGHT);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const playerName = this.bannedPlayer ? this.bannedPlayer.getName() : "Player";
    ctx.fillText(
      `Ban ${playerName}`,
      this.windowX + PADDING,
      this.windowY + TITLE_BAR_HEIGHT / 2,
    );
  }

  private renderBanOptions(ctx: CanvasRenderingContext2D): void {
    for (const option of this.banOptions) {
      const isSelected = this.selectedReason === option.id;
      ctx.fillStyle = isSelected
        ? "#e74c3c"
        : option.hovered
          ? "#f5f5f5"
          : "#ffffff";
      this.drawRoundedRect(ctx, option.x, option.y, option.width, option.height, 5);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#c0392b" : "#dddddd";
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, option.x, option.y, option.width, option.height, 5);
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#ffffff" : "#333333";
      ctx.font = "16px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(option.label, option.x + 15, option.y + option.height / 2);

      if (isSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px system-ui";
        ctx.textAlign = "right";
        ctx.fillText(
          "✓", option.x + option.width - 15, option.y + option.height / 2,
        );
      }
    }
  }

  private renderDurationSection(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#333333";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("Duration", this.windowX + PADDING, this.durationContainerY + 10);

    // Permanent checkbox
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.permanentCheckboxX, this.permanentCheckboxY,
      this.permanentCheckboxSize, this.permanentCheckboxSize,
    );
    if (this.isPermanent) {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(
        this.permanentCheckboxX + 4, this.permanentCheckboxY + 4,
        this.permanentCheckboxSize - 8, this.permanentCheckboxSize - 8,
      );
    }
    ctx.fillStyle = "#333333";
    ctx.font = "16px system-ui";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Permanent",
      this.permanentCheckboxX + this.permanentCheckboxSize + 10,
      this.permanentCheckboxY + this.permanentCheckboxSize / 2,
    );

    if (this.isPermanent) return;

    // Decrease button
    ctx.fillStyle = this.decreaseValueBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(
      ctx, this.decreaseValueBtnX, this.decreaseValueBtnY,
      this.decreaseValueBtnSize, this.decreaseValueBtnSize, 5,
    );
    ctx.fill();
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.fillText(
      "-",
      this.decreaseValueBtnX + this.decreaseValueBtnSize / 2,
      this.decreaseValueBtnY + this.decreaseValueBtnSize / 2,
    );

    // Value
    ctx.textAlign = "center";
    ctx.font = "18px system-ui";
    ctx.fillText(
      this.durationValue.toString(),
      this.increaseValueBtnX - 25,
      this.increaseValueBtnY + this.increaseValueBtnSize / 2,
    );

    // Increase button
    ctx.fillStyle = this.increaseValueBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(
      ctx, this.increaseValueBtnX, this.increaseValueBtnY,
      this.increaseValueBtnSize, this.increaseValueBtnSize, 5,
    );
    ctx.fill();
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.fillText(
      "+",
      this.increaseValueBtnX + this.increaseValueBtnSize / 2,
      this.increaseValueBtnY + this.increaseValueBtnSize / 2,
    );

    // Unit toggle
    ctx.fillStyle = this.unitBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(
      ctx, this.unitBtnX, this.unitBtnY,
      this.unitBtnWidth, this.unitBtnHeight, 5,
    );
    ctx.fill();
    ctx.fillStyle = "#333333";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      DURATION_UNITS[this.durationUnitIndex].label,
      this.unitBtnX + this.unitBtnWidth / 2,
      this.unitBtnY + this.unitBtnHeight / 2,
    );
  }

  private renderButtons(ctx: CanvasRenderingContext2D): void {
    // Cancel
    ctx.fillStyle = this.cancelButtonHovered ? "#7ed321" : "#4a90e2";
    this.drawRoundedRect(
      ctx, this.cancelButtonX, this.cancelButtonY,
      this.cancelButtonWidth, this.cancelButtonHeight, 5,
    );
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      "Cancel",
      this.cancelButtonX + this.cancelButtonWidth / 2,
      this.cancelButtonY + this.cancelButtonHeight / 2,
    );

    // Confirm
    const isConfirmEnabled = this.selectedReason !== null;
    ctx.fillStyle = isConfirmEnabled
      ? this.confirmButtonHovered ? "#c0392b" : "#e74c3c"
      : "#cccccc";
    this.drawRoundedRect(
      ctx, this.confirmButtonX, this.confirmButtonY,
      this.confirmButtonWidth, this.confirmButtonHeight, 5,
    );
    ctx.fill();
    ctx.fillStyle = isConfirmEnabled ? "#ffffff" : "#999999";
    ctx.fillText(
      "Ban",
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

  private isPointInRect(
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number,
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
