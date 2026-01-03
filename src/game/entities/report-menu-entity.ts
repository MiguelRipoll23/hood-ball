import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import { BackdropEntity } from "./common/backdrop-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { ActionMenuContract } from "../interfaces/ui/action-menu-contract.js";

interface ReportOption {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hovered: boolean;
}

export class ReportMenuEntity extends BaseTappableGameEntity implements ActionMenuContract {
  private readonly WINDOW_WIDTH = 400;
  private readonly WINDOW_HEIGHT = 450;
  private readonly TITLE_BAR_HEIGHT = 50;
  private readonly OPTION_HEIGHT = 50;
  private readonly OPTION_MARGIN = 10;
  private readonly PADDING = 20;

  private readonly REPORT_REASONS = [
    { id: "offensive_language", label: "Offensive Language" },
    { id: "inappropriate_name", label: "Inappropriate Name" },
    { id: "cheating", label: "Cheating" },
    { id: "griefing", label: "Griefing/Trolling" },
    { id: "harassment", label: "Harassment" },
  ];

  private canvas: HTMLCanvasElement | null = null;
  private backdropEntity: BackdropEntity | null = null;
  private isOpened = false;
  private reportedPlayer: GamePlayer | null = null;
  private reportOptions: ReportOption[] = [];
  private selectedReason: string | null = null;
  private confirmedReason: string | null = null;
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

  constructor(canvas: HTMLCanvasElement) {
    super(false);
    this.canvas = canvas;
    this.opacity = 0;
  }

  public override load(): void {
    // Create backdrop only when needed
    if (!this.backdropEntity) {
      // We need canvas, but we'll create it on open when we have access to it
    }
    super.load();
  }

  public isOpen(): boolean {
    return this.isOpened;
  }

  public getReportedPlayer(): GamePlayer | null {
    return this.reportedPlayer;
  }

  public getConfirmedReason(): string | null {
    const reason = this.confirmedReason;
    this.confirmedReason = null; // Reset after reading
    return reason;
  }

  public isCancelled(): boolean {
    const result = this.cancelled;
    this.cancelled = false; // Reset after reading
    return result;
  }

  public open(player: GamePlayer): void {
    this.isOpened = true;
    this.reportedPlayer = player;
    this.selectedReason = null;
    this.confirmedReason = null;
    this.cancelled = false;
    this.opacity = 1;
    this.active = true;

    this.calculateLayout();
  }

  public close(): void {
    this.isOpened = false;
    this.reportedPlayer = null;
    this.selectedReason = null;
    this.opacity = 0;
    this.active = false;
  }

  private calculateLayout(): void {
    // Get actual canvas dimensions
    const canvasWidth = this.canvas?.width || 800;
    const canvasHeight = this.canvas?.height || 600;

    this.windowX = (canvasWidth - this.WINDOW_WIDTH) / 2;
    this.windowY = (canvasHeight - this.WINDOW_HEIGHT) / 2;

    // Create report options
    this.reportOptions = [];
    let currentY = this.windowY + this.TITLE_BAR_HEIGHT + this.PADDING;

    for (const reason of this.REPORT_REASONS) {
      this.reportOptions.push({
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

    // Position confirm and cancel buttons
    // Ensure we have enough space below the last option
    const buttonY = Math.max(
      currentY + this.PADDING,
      this.windowY + this.WINDOW_HEIGHT - this.PADDING - this.confirmButtonHeight
    );
    
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
    this.reportOptions.forEach((opt) => (opt.hovered = false));

    if (touches.length === 0) {
      return;
    }

    for (const touch of touches) {
      // Check confirm button
      const isInConfirm =
        touch.x >= this.confirmButtonX &&
        touch.x <= this.confirmButtonX + this.confirmButtonWidth &&
        touch.y >= this.confirmButtonY &&
        touch.y <= this.confirmButtonY + this.confirmButtonHeight;

      // Check cancel button
      const isInCancel =
        touch.x >= this.cancelButtonX &&
        touch.x <= this.cancelButtonX + this.cancelButtonWidth &&
        touch.y >= this.cancelButtonY &&
        touch.y <= this.cancelButtonY + this.cancelButtonHeight;

      // Check report options
      let touchedOption: ReportOption | null = null;
      for (const option of this.reportOptions) {
        const isInOption =
          touch.x >= option.x &&
          touch.x <= option.x + option.width &&
          touch.y >= option.y &&
          touch.y <= option.y + option.height;
        if (isInOption) {
          touchedOption = option;
          break;
        }
      }

      const isHoveringSomething = !!(isInConfirm || isInCancel || touchedOption);

      if (isHoveringSomething) {
        this.hovering = true;
        
        // Set visual hover states for all touches
        if (isInConfirm) this.confirmButtonHovered = true;
        if (isInCancel) this.cancelButtonHovered = true;
        if (touchedOption) touchedOption.hovered = true;

        if (touch.pressed) {
          this.pressed = true;
          // On press, lock the hover state to only the pressed element
          this.confirmButtonHovered = isInConfirm;
          this.cancelButtonHovered = isInCancel;
          this.reportOptions.forEach(
            (opt) => (opt.hovered = opt === touchedOption)
          );
          break;
        }
      }
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Handle button presses BEFORE calling super.update
    if (this.pressed) {
      // Check if confirm button was clicked
      if (this.confirmButtonHovered && this.selectedReason) {
        this.confirmedReason = this.selectedReason;
      }

      // Check if cancel button was clicked
      if (this.cancelButtonHovered) {
        this.cancelled = true;
      }

      // Check if a report option was clicked
      for (const option of this.reportOptions) {
        if (option.hovered) {
          this.selectedReason = option.id;
          break;
        }
      }
    }

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (!this.isOpened || this.opacity === 0) {
      return;
    }

    context.save();
    context.globalAlpha = this.opacity;

    // Render backdrop
    this.renderBackdrop(context);

    // Render window
    this.renderWindow(context);

    // Render title bar
    this.renderTitleBar(context);

    // Render report options
    this.renderReportOptions(context);

    // Render buttons
    this.renderButtons(context);

    context.restore();
    super.render(context);
  }

  private renderBackdrop(context: CanvasRenderingContext2D): void {
    // Simple dark backdrop
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }

  private renderWindow(context: CanvasRenderingContext2D): void {
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 10;

    context.fillStyle = "#ffffff";
    this.drawRoundedRect(
      context,
      this.windowX,
      this.windowY,
      this.WINDOW_WIDTH,
      this.WINDOW_HEIGHT,
      12
    );
    context.fill();

    // Reset shadow
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  private renderTitleBar(context: CanvasRenderingContext2D): void {
    const radius = 12;

    context.save();
    // Clip to rounded top corners
    context.beginPath();
    context.moveTo(this.windowX + radius, this.windowY);
    context.lineTo(this.windowX + this.WINDOW_WIDTH - radius, this.windowY);
    context.quadraticCurveTo(
      this.windowX + this.WINDOW_WIDTH,
      this.windowY,
      this.windowX + this.WINDOW_WIDTH,
      this.windowY + radius
    );
    context.lineTo(this.windowX + this.WINDOW_WIDTH, this.windowY + this.TITLE_BAR_HEIGHT);
    context.lineTo(this.windowX, this.windowY + this.TITLE_BAR_HEIGHT);
    context.lineTo(this.windowX, this.windowY + radius);
    context.quadraticCurveTo(
      this.windowX,
      this.windowY,
      this.windowX + radius,
      this.windowY
    );
    context.closePath();
    context.clip();

    // Gradient background
    const gradient = context.createLinearGradient(
      this.windowX,
      this.windowY,
      this.windowX,
      this.windowY + this.TITLE_BAR_HEIGHT
    );
    gradient.addColorStop(0, "#4a90e2");
    gradient.addColorStop(1, "#357abd");

    context.fillStyle = gradient;
    context.fillRect(
      this.windowX,
      this.windowY,
      this.WINDOW_WIDTH,
      this.TITLE_BAR_HEIGHT
    );

    context.restore();

    // Title text
    context.fillStyle = "#ffffff";
    context.font = "bold 22px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";

    const playerName = this.reportedPlayer
      ? this.reportedPlayer.getName()
      : "Player";
    context.fillText(
      `Report ${playerName}`,
      this.windowX + this.PADDING,
      this.windowY + this.TITLE_BAR_HEIGHT / 2
    );
  }

  private renderReportOptions(context: CanvasRenderingContext2D): void {
    for (const option of this.reportOptions) {
      const isSelected = this.selectedReason === option.id;

      // Option background
      if (isSelected) {
        context.fillStyle = "#e74c3c";
      } else if (option.hovered) {
        context.fillStyle = "#f5f5f5";
      } else {
        context.fillStyle = "#ffffff";
      }

      this.drawRoundedRect(
        context,
        option.x,
        option.y,
        option.width,
        option.height,
        5
      );
      context.fill();

      // Option border
      context.strokeStyle = isSelected ? "#c0392b" : "#dddddd";
      context.lineWidth = 2;
      this.drawRoundedRect(
        context,
        option.x,
        option.y,
        option.width,
        option.height,
        5
      );
      context.stroke();

      // Option text
      context.fillStyle = isSelected ? "#ffffff" : "#333333";
      context.font = "18px system-ui";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(
        option.label,
        option.x + 15,
        option.y + option.height / 2
      );

      // Selection indicator
      if (isSelected) {
        context.fillStyle = "#ffffff";
        context.font = "20px system-ui";
        context.textAlign = "right";
        context.fillText(
          "✓",
          option.x + option.width - 15,
          option.y + option.height / 2
        );
      }
    }
  }

  private renderButtons(context: CanvasRenderingContext2D): void {
    // Cancel button
    const cancelColor = this.cancelButtonHovered ? "#95a5a6" : "#bdc3c7";
    context.fillStyle = cancelColor;
    this.drawRoundedRect(
      context,
      this.cancelButtonX,
      this.cancelButtonY,
      this.cancelButtonWidth,
      this.cancelButtonHeight,
      5
    );
    context.fill();

    context.fillStyle = "#ffffff";
    context.font = "bold 16px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "Cancel",
      this.cancelButtonX + this.cancelButtonWidth / 2,
      this.cancelButtonY + this.cancelButtonHeight / 2
    );

    // Confirm button (only enabled if a reason is selected)
    const isConfirmEnabled = this.selectedReason !== null;
    const confirmColor = isConfirmEnabled
      ? this.confirmButtonHovered
        ? "#c0392b"
        : "#e74c3c"
      : "#cccccc";

    context.fillStyle = confirmColor;
    this.drawRoundedRect(
      context,
      this.confirmButtonX,
      this.confirmButtonY,
      this.confirmButtonWidth,
      this.confirmButtonHeight,
      5
    );
    context.fill();

    context.fillStyle = isConfirmEnabled ? "#ffffff" : "#999999";
    context.font = "bold 16px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "Report",
      this.confirmButtonX + this.confirmButtonWidth / 2,
      this.confirmButtonY + this.confirmButtonHeight / 2
    );
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
