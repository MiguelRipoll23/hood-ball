import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import { PlayerModerationService } from "../services/network/player-moderation-service.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";

interface ClickableArea {
  x: number;
  y: number;
  width: number;
  height: number;
  action: () => void;
}

export class MatchMenuEntity extends BaseTappableGameEntity {
  private readonly MENU_WIDTH = 400;
  private readonly MENU_HEIGHT = 500;
  private readonly BORDER_RADIUS = 16;
  private readonly BACKGROUND_COLOR = "rgba(0, 0, 0, 0.85)";
  private readonly TEXT_COLOR = "#ffffff";
  private readonly PADDING = 20;
  private readonly LINE_HEIGHT = 40;
  private readonly BUTTON_HEIGHT = 32;

  private players: GamePlayer[] = [];
  private localPlayerId: string = "";
  private selectedPlayerId: string | null = null;
  private showReportReasons = false;
  private clickableAreas: ClickableArea[] = [];

  private readonly reportReasons = [
    "Offensive language",
    "Inappropriate behavior",
    "Cheating",
    "Spam",
    "Other misconduct",
  ];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly playerModerationService: PlayerModerationService,
    private readonly gamePointer: GamePointerContract,
    private readonly onClose: () => void
  ) {
    super(true); // stealFocus = true to capture all clicks
    this.width = this.MENU_WIDTH;
    this.height = this.MENU_HEIGHT;
    this.setPosition();
  }

  public setPlayers(players: GamePlayer[], localPlayerId: string): void {
    this.players = players;
    this.localPlayerId = localPlayerId;
  }

  private setPosition(): void {
    this.x = (this.canvas.width - this.MENU_WIDTH) / 2;
    this.y = (this.canvas.height - this.MENU_HEIGHT) / 2;
  }

  private async handleReport(reason: string): Promise<void> {
    if (!this.selectedPlayerId) {
      return;
    }

    try {
      await this.playerModerationService.reportUser(
        this.selectedPlayerId,
        reason,
        false
      );
      console.log(
        `Reported player ${this.selectedPlayerId} for: ${reason}`
      );
      this.selectedPlayerId = null;
      this.showReportReasons = false;
      this.onClose();
    } catch (error) {
      console.error("Failed to report user:", error);
    }
  }

  public override update(delta: DOMHighResTimeStamp): void {
    // Handle clicks
    if (this.pressed) {
      const touches = this.gamePointer.getTouchPoints();
      for (const touch of touches) {
        if (touch.pressed) {
          // Check clickable areas
          for (const area of this.clickableAreas) {
            if (
              touch.x >= area.x &&
              touch.x <= area.x + area.width &&
              touch.y >= area.y &&
              touch.y <= area.y + area.height
            ) {
              area.action();
              break;
            }
          }
        }
      }
    }

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Reset clickable areas before rendering
    this.clickableAreas = [];

    context.save();

    // Draw semi-transparent background
    context.fillStyle = this.BACKGROUND_COLOR;
    this.drawRoundedRect(
      context,
      this.x,
      this.y,
      this.width,
      this.height,
      this.BORDER_RADIUS
    );
    context.fill();

    // Draw title
    context.fillStyle = this.TEXT_COLOR;
    context.font = "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText("Match Menu", this.x + this.PADDING, this.y + this.PADDING);

    // Draw close button (X in top-right)
    const closeButtonX = this.x + this.width - this.PADDING - 30;
    const closeButtonY = this.y + this.PADDING;
    context.font = "24px system-ui";
    context.textAlign = "right";
    context.fillText("✕", this.x + this.width - this.PADDING, this.y + this.PADDING);
    
    // Add close button clickable area
    this.clickableAreas.push({
      x: closeButtonX,
      y: closeButtonY - 5,
      width: 30,
      height: 30,
      action: () => this.onClose(),
    });

    let yOffset = this.y + this.PADDING + 40;

    if (!this.showReportReasons) {
      // Draw player list
      context.font = "bold 18px system-ui";
      context.textAlign = "left";
      context.fillText("Players:", this.x + this.PADDING, yOffset);
      yOffset += this.LINE_HEIGHT;

      context.font = "16px system-ui";
      for (const player of this.players) {
        const isLocalPlayer = player.getNetworkId() === this.localPlayerId;
        const playerName = player.getName() + (isLocalPlayer ? " (You)" : "");
        
        context.fillStyle = this.TEXT_COLOR;
        context.fillText(playerName, this.x + this.PADDING + 10, yOffset);

        // Draw report button for other players
        if (!isLocalPlayer) {
          const buttonX = this.x + this.width - this.PADDING - 80;
          const buttonY = yOffset - 5;
          const buttonWidth = 80;

          // Draw button background
          context.fillStyle = "rgba(200, 50, 50, 0.8)";
          this.drawRoundedRect(
            context,
            buttonX,
            buttonY,
            buttonWidth,
            this.BUTTON_HEIGHT,
            4
          );
          context.fill();

          // Draw button text
          context.fillStyle = "#ffffff";
          context.textAlign = "center";
          context.fillText(
            "Report",
            buttonX + buttonWidth / 2,
            buttonY + this.BUTTON_HEIGHT / 2 + 5
          );

          // Add report button clickable area
          const playerId = player.getNetworkId();
          this.clickableAreas.push({
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: this.BUTTON_HEIGHT,
            action: () => {
              this.selectedPlayerId = playerId;
              this.showReportReasons = true;
            },
          });
        }

        yOffset += this.LINE_HEIGHT;
      }
    } else {
      // Draw report reasons
      context.font = "bold 18px system-ui";
      context.textAlign = "left";
      context.fillText("Select reason:", this.x + this.PADDING, yOffset);
      yOffset += this.LINE_HEIGHT;

      context.font = "16px system-ui";
      for (const reason of this.reportReasons) {
        const buttonX = this.x + this.PADDING + 10;
        const buttonY = yOffset - 5;
        const buttonWidth = this.width - 2 * this.PADDING - 20;

        // Draw button background
        context.fillStyle = "rgba(100, 100, 100, 0.6)";
        this.drawRoundedRect(
          context,
          buttonX,
          buttonY,
          buttonWidth,
          this.BUTTON_HEIGHT,
          4
        );
        context.fill();

        // Draw button text
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.fillText(
          reason,
          buttonX + buttonWidth / 2,
          buttonY + this.BUTTON_HEIGHT / 2 + 5
        );

        // Add reason button clickable area
        this.clickableAreas.push({
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: this.BUTTON_HEIGHT,
          action: () => this.handleReport(reason),
        });

        yOffset += this.LINE_HEIGHT;
      }

      // Back button
      yOffset += 20;
      const backButtonX = this.x + this.PADDING + 10;
      const backButtonY = yOffset - 5;
      const backButtonWidth = this.width - 2 * this.PADDING - 20;

      context.fillStyle = "rgba(80, 80, 80, 0.6)";
      this.drawRoundedRect(
        context,
        backButtonX,
        backButtonY,
        backButtonWidth,
        this.BUTTON_HEIGHT,
        4
      );
      context.fill();

      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.fillText(
        "Back",
        backButtonX + backButtonWidth / 2,
        backButtonY + this.BUTTON_HEIGHT / 2 + 5
      );

      // Add back button clickable area
      this.clickableAreas.push({
        x: backButtonX,
        y: backButtonY,
        width: backButtonWidth,
        height: this.BUTTON_HEIGHT,
        action: () => {
          this.showReportReasons = false;
          this.selectedPlayerId = null;
        },
      });
    }

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
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
}
