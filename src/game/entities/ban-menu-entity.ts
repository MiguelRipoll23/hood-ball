import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { BanOption } from "../interfaces/ui/ban-option.js";
import type { DurationUnit } from "../interfaces/ui/duration-unit.js";

export class BanMenuEntity extends BaseTappableGameEntity {
  private readonly WINDOW_WIDTH = 400;
  private readonly WINDOW_HEIGHT = 500;
  private readonly TITLE_BAR_HEIGHT = 50;
  private readonly OPTION_HEIGHT = 40;
  private readonly OPTION_MARGIN = 10;
  private readonly PADDING = 20;

  private readonly BAN_REASONS = [
    { id: "offensive_language", label: "Offensive Language" },
    { id: "inappropriate_name", label: "Inappropriate Name" },
    { id: "cheating", label: "Cheating" },
    { id: "griefing", label: "Griefing/Trolling" },
    { id: "harassment", label: "Harassment" },
  ];

  private readonly DURATION_UNITS: DurationUnit[] = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" },
    { value: "years", label: "Years" },
  ];

  private canvas: HTMLCanvasElement | null = null;
  private isOpened = false;
  private bannedPlayer: GamePlayer | null = null;
  private banOptions: BanOption[] = [];
  private selectedReason: string | null = null;
  
  // Duration state
  private durationValue: number = 1;
  private durationUnitIndex: number = 1; // Default to Hours
  private isPermanent: boolean = false;
  
  // Confirmed result
  private confirmedData: {
    reason: string;
    duration?: { value: number; unit: string };
  } | null = null;
  
  private cancelled = false;

  private windowX = 0;
  private windowY = 0;

  private confirmButtonX = 0;
  private confirmButtonY = 0;
  private confirmButtonWidth = 120;
  private confirmButtonHeight = 40;
  private confirmButtonHovered = false;

  private cancelButtonX = 0;
  private cancelButtonY = 0;
  private cancelButtonWidth = 120;
  private cancelButtonHeight = 40;
  private cancelButtonHovered = false;

  // Duration controls
  private durationContainerY = 0;
  
  private decreaseValueBtnX = 0;
  private decreaseValueBtnY = 0;
  private decreaseValueBtnSize = 30;
  private decreaseValueBtnHovered = false;
  
  private increaseValueBtnX = 0;
  private increaseValueBtnY = 0;
  private increaseValueBtnSize = 30;
  private increaseValueBtnHovered = false;
  
  private unitBtnX = 0;
  private unitBtnY = 0;
  private unitBtnWidth = 100;
  private unitBtnHeight = 30;
  private unitBtnHovered = false;

  private permanentCheckboxX = 0;
  private permanentCheckboxY = 0;
  private permanentCheckboxSize = 20;
  private permanentCheckboxHovered = false;

  constructor(canvas: HTMLCanvasElement) {
    super(false);
    this.canvas = canvas;
    this.opacity = 0;
  }

  public override load(): void {
    super.load();
  }

  public isOpen(): boolean {
    return this.isOpened;
  }

  public getBannedPlayer(): GamePlayer | null {
    return this.bannedPlayer;
  }

  public getConfirmedData(): { reason: string; duration?: { value: number; unit: string } } | null {
    const data = this.confirmedData;
    this.confirmedData = null; // Reset after reading
    return data;
  }

  public isCancelled(): boolean {
    const result = this.cancelled;
    this.cancelled = false; // Reset after reading
    return result;
  }

  public open(player: GamePlayer): void {
    this.isOpened = true;
    this.bannedPlayer = player;
    this.selectedReason = null;
    this.confirmedData = null;
    this.cancelled = false;
    this.opacity = 1;
    this.active = true;
    
    // Reset duration defaults
    this.durationValue = 1;
    this.durationUnitIndex = 1; // Hours
    this.isPermanent = false;

    this.calculateLayout();
  }

  public close(): void {
    this.isOpened = false;
    this.bannedPlayer = null;
    this.selectedReason = null;
    this.opacity = 0;
    this.active = false;
  }

  private calculateLayout(): void {
    const canvasWidth = this.canvas?.width || 800;
    const canvasHeight = this.canvas?.height || 600;

    this.windowX = (canvasWidth - this.WINDOW_WIDTH) / 2;
    this.windowY = (canvasHeight - this.WINDOW_HEIGHT) / 2;

    // Create ban reasons
    this.banOptions = [];
    let currentY = this.windowY + this.TITLE_BAR_HEIGHT + this.PADDING;

    for (const reason of this.BAN_REASONS) {
      this.banOptions.push({
        id: reason.id,
        label: reason.label,
        x: this.windowX + this.PADDING,
        y: currentY,
        width: this.WINDOW_WIDTH - this.PADDING * 2,
        height: this.OPTION_HEIGHT,
        hovered: false,
      });
      currentY += this.OPTION_HEIGHT + this.OPTION_MARGIN;
    }

    // Duration Section
    this.durationContainerY = currentY + 10;
    
    // Permanent checkbox (First row below title)
    this.permanentCheckboxX = this.windowX + this.PADDING;
    this.permanentCheckboxY = this.durationContainerY + 30;

    // Value controls (Second row)
    const controlsY = this.permanentCheckboxY + this.permanentCheckboxSize + 15;
    
    this.decreaseValueBtnX = this.windowX + this.PADDING;
    this.decreaseValueBtnY = controlsY;
    
    this.increaseValueBtnX = this.windowX + this.PADDING + 80;
    this.increaseValueBtnY = controlsY;

    // Unit toggle (Next to value controls)
    this.unitBtnX = this.increaseValueBtnX + this.increaseValueBtnSize + 10;
    this.unitBtnY = controlsY;

    // Position confirm and cancel buttons
    const buttonY = this.windowY + this.WINDOW_HEIGHT - this.PADDING - this.confirmButtonHeight;
    
    this.confirmButtonX =
      this.windowX + this.WINDOW_WIDTH - this.PADDING - this.confirmButtonWidth;
    this.confirmButtonY = buttonY;

    this.cancelButtonX = this.confirmButtonX - this.cancelButtonWidth - 10;
    this.cancelButtonY = buttonY;
  }

  public override handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract
  ): void {
    const touches = gamePointer.getTouchPoints();
    
    this.hovering = false;
    this.pressed = false;
    this.confirmButtonHovered = false;
    this.cancelButtonHovered = false;
    this.decreaseValueBtnHovered = false;
    this.increaseValueBtnHovered = false;
    this.unitBtnHovered = false;
    this.permanentCheckboxHovered = false;
    this.banOptions.forEach((opt) => (opt.hovered = false));

    if (touches.length === 0) return;

    for (const touch of touches) {
      // Buttons
      const isInConfirm = this.isPointInRect(touch.x, touch.y, this.confirmButtonX, this.confirmButtonY, this.confirmButtonWidth, this.confirmButtonHeight);
      const isInCancel = this.isPointInRect(touch.x, touch.y, this.cancelButtonX, this.cancelButtonY, this.cancelButtonWidth, this.cancelButtonHeight);
      
      // Duration Controls (only check if not permanent, except for checkbox)
      let isInDecrease = false;
      let isInIncrease = false;
      let isInUnit = false;
      
      if (!this.isPermanent) {
        isInDecrease = this.isPointInRect(touch.x, touch.y, this.decreaseValueBtnX, this.decreaseValueBtnY, this.decreaseValueBtnSize, this.decreaseValueBtnSize);
        isInIncrease = this.isPointInRect(touch.x, touch.y, this.increaseValueBtnX, this.increaseValueBtnY, this.increaseValueBtnSize, this.increaseValueBtnSize);
        isInUnit = this.isPointInRect(touch.x, touch.y, this.unitBtnX, this.unitBtnY, this.unitBtnWidth, this.unitBtnHeight);
      }
      
      const isInCheckbox = this.isPointInRect(touch.x, touch.y, this.permanentCheckboxX, this.permanentCheckboxY, this.permanentCheckboxSize + 100, this.permanentCheckboxSize); // Larger hit area for label

      // Options
      let touchedOption: BanOption | null = null;
      for (const option of this.banOptions) {
        if (this.isPointInRect(touch.x, touch.y, option.x, option.y, option.width, option.height)) {
          touchedOption = option;
          break;
        }
      }

      const isHoveringSomething = !!(isInConfirm || isInCancel || isInDecrease || isInIncrease || isInUnit || isInCheckbox || touchedOption);

      if (isHoveringSomething) {
        this.hovering = true;
        
        if (isInConfirm) this.confirmButtonHovered = true;
        if (isInCancel) this.cancelButtonHovered = true;
        if (isInDecrease) this.decreaseValueBtnHovered = true;
        if (isInIncrease) this.increaseValueBtnHovered = true;
        if (isInUnit) this.unitBtnHovered = true;
        if (isInCheckbox) this.permanentCheckboxHovered = true;
        if (touchedOption) touchedOption.hovered = true;

        if (touch.pressed) {
          this.pressed = true;
          // Hover locking
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

  private isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  public override update(delta: DOMHighResTimeStamp): void {
    if (this.pressed) {
      if (this.confirmButtonHovered && this.selectedReason) {
        this.confirmedData = {
          reason: this.selectedReason,
          duration: this.isPermanent ? undefined : {
            value: this.durationValue,
            unit: this.DURATION_UNITS[this.durationUnitIndex].value
          }
        };
      } else if (this.cancelButtonHovered) {
        this.cancelled = true;
      } else if (this.decreaseValueBtnHovered && this.durationValue > 1) {
        this.durationValue--;
      } else if (this.increaseValueBtnHovered) {
        this.durationValue++;
      } else if (this.unitBtnHovered) {
        this.durationUnitIndex = (this.durationUnitIndex + 1) % this.DURATION_UNITS.length;
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
    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (!this.isOpened || this.opacity === 0) return;

    context.save();
    context.globalAlpha = this.opacity;

    this.renderBackdrop(context);
    this.renderWindow(context);
    this.renderTitleBar(context);
    this.renderBanOptions(context);
    this.renderDurationSection(context);
    this.renderButtons(context);

    context.restore();
    super.render(context);
  }

  private renderBackdrop(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }

  private renderWindow(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 10;

    context.fillStyle = "#ffffff";
    this.drawRoundedRect(context, this.windowX, this.windowY, this.WINDOW_WIDTH, this.WINDOW_HEIGHT, 12);
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  private renderTitleBar(context: CanvasRenderingContext2D): void {
    const radius = 12;
    context.save();
    context.beginPath();
    context.moveTo(this.windowX + radius, this.windowY);
    context.lineTo(this.windowX + this.WINDOW_WIDTH - radius, this.windowY);
    context.quadraticCurveTo(this.windowX + this.WINDOW_WIDTH, this.windowY, this.windowX + this.WINDOW_WIDTH, this.windowY + radius);
    context.lineTo(this.windowX + this.WINDOW_WIDTH, this.windowY + this.TITLE_BAR_HEIGHT);
    context.lineTo(this.windowX, this.windowY + this.TITLE_BAR_HEIGHT);
    context.lineTo(this.windowX, this.windowY + radius);
    context.quadraticCurveTo(this.windowX, this.windowY, this.windowX + radius, this.windowY);
    context.closePath();
    context.clip();

    const gradient = context.createLinearGradient(this.windowX, this.windowY, this.windowX, this.windowY + this.TITLE_BAR_HEIGHT);
    gradient.addColorStop(0, "#e74c3c"); // Red for Ban
    gradient.addColorStop(1, "#c0392b");

    context.fillStyle = gradient;
    context.fillRect(this.windowX, this.windowY, this.WINDOW_WIDTH, this.TITLE_BAR_HEIGHT);
    context.restore();

    context.fillStyle = "#ffffff";
    context.font = "bold 22px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";

    const playerName = this.bannedPlayer ? this.bannedPlayer.getName() : "Player";
    context.fillText(`Ban ${playerName}`, this.windowX + this.PADDING, this.windowY + this.TITLE_BAR_HEIGHT / 2);
  }

  private renderBanOptions(context: CanvasRenderingContext2D): void {
    for (const option of this.banOptions) {
      const isSelected = this.selectedReason === option.id;

      if (isSelected) {
        context.fillStyle = "#e74c3c";
      } else if (option.hovered) {
        context.fillStyle = "#f5f5f5";
      } else {
        context.fillStyle = "#ffffff";
      }

      this.drawRoundedRect(context, option.x, option.y, option.width, option.height, 5);
      context.fill();

      context.strokeStyle = isSelected ? "#c0392b" : "#dddddd";
      context.lineWidth = 2;
      this.drawRoundedRect(context, option.x, option.y, option.width, option.height, 5);
      context.stroke();

      context.fillStyle = isSelected ? "#ffffff" : "#333333";
      context.font = "16px system-ui";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(option.label, option.x + 15, option.y + option.height / 2);

      if (isSelected) {
        context.fillStyle = "#ffffff";
        context.font = "18px system-ui";
        context.textAlign = "right";
        context.fillText("✓", option.x + option.width - 15, option.y + option.height / 2);
      }
    }
  }

  private renderDurationSection(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#333333";
    context.font = "bold 16px system-ui";
    context.textAlign = "left";
    context.fillText("Duration", this.windowX + this.PADDING, this.durationContainerY + 10);

    // Permanent Checkbox
    context.strokeStyle = "#333333";
    context.lineWidth = 2;
    context.strokeRect(this.permanentCheckboxX, this.permanentCheckboxY, this.permanentCheckboxSize, this.permanentCheckboxSize);
    
    if (this.isPermanent) {
        context.fillStyle = "#e74c3c";
        context.fillRect(this.permanentCheckboxX + 4, this.permanentCheckboxY + 4, this.permanentCheckboxSize - 8, this.permanentCheckboxSize - 8);
    }
    
    context.fillStyle = "#333333";
    context.font = "16px system-ui";
    context.textBaseline = "middle";
    context.fillText("Permanent", this.permanentCheckboxX + this.permanentCheckboxSize + 10, this.permanentCheckboxY + this.permanentCheckboxSize / 2);

    if (this.isPermanent) return;

    // Value Controls
    // Decrease
    context.fillStyle = this.decreaseValueBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(context, this.decreaseValueBtnX, this.decreaseValueBtnY, this.decreaseValueBtnSize, this.decreaseValueBtnSize, 5);
    context.fill();
    context.fillStyle = "#333333";
    context.textAlign = "center";
    context.fillText("-", this.decreaseValueBtnX + this.decreaseValueBtnSize/2, this.decreaseValueBtnY + this.decreaseValueBtnSize/2);

    // Value Display
    context.textAlign = "center";
    context.font = "18px system-ui";
    context.fillText(this.durationValue.toString(), this.increaseValueBtnX - 25, this.increaseValueBtnY + this.increaseValueBtnSize/2);

    // Increase
    context.fillStyle = this.increaseValueBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(context, this.increaseValueBtnX, this.increaseValueBtnY, this.increaseValueBtnSize, this.increaseValueBtnSize, 5);
    context.fill();
    context.fillStyle = "#333333";
    context.textAlign = "center";
    context.fillText("+", this.increaseValueBtnX + this.increaseValueBtnSize/2, this.increaseValueBtnY + this.increaseValueBtnSize/2);

    // Unit Toggle
    context.fillStyle = this.unitBtnHovered ? "#bdc3c7" : "#ecf0f1";
    this.drawRoundedRect(context, this.unitBtnX, this.unitBtnY, this.unitBtnWidth, this.unitBtnHeight, 5);
    context.fill();
    context.fillStyle = "#333333";
    context.font = "14px system-ui";
    context.textAlign = "center";
    context.fillText(this.DURATION_UNITS[this.durationUnitIndex].label, this.unitBtnX + this.unitBtnWidth/2, this.unitBtnY + this.unitBtnHeight/2);
  }

  private renderButtons(context: CanvasRenderingContext2D): void {
    // Cancel
    context.fillStyle = this.cancelButtonHovered ? "#95a5a6" : "#bdc3c7";
    this.drawRoundedRect(context, this.cancelButtonX, this.cancelButtonY, this.cancelButtonWidth, this.cancelButtonHeight, 5);
    context.fill();
    context.fillStyle = "#ffffff";
    context.font = "bold 16px system-ui";
    context.textAlign = "center";
    context.fillText("Cancel", this.cancelButtonX + this.cancelButtonWidth/2, this.cancelButtonY + this.cancelButtonHeight/2);

    // Confirm
    const isConfirmEnabled = this.selectedReason !== null;
    context.fillStyle = isConfirmEnabled ? (this.confirmButtonHovered ? "#c0392b" : "#e74c3c") : "#cccccc";
    this.drawRoundedRect(context, this.confirmButtonX, this.confirmButtonY, this.confirmButtonWidth, this.confirmButtonHeight, 5);
    context.fill();
    context.fillStyle = isConfirmEnabled ? "#ffffff" : "#999999";
    context.fillText("Ban", this.confirmButtonX + this.confirmButtonWidth/2, this.confirmButtonY + this.confirmButtonHeight/2);
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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