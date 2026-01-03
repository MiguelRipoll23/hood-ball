import { BaseTappableGameEntity } from "../../engine/entities/base-tappable-game-entity.js";
import { BackdropEntity } from "./common/backdrop-entity.js";
import { CloseButtonEntity } from "./close-button-entity.js";
import { SmallButtonEntity } from "./common/small-button-entity.js";
import { PlayersListEntity } from "./players-list-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { PlayerModerationService } from "../services/network/player-moderation-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";

export class MatchMenuEntity extends BaseTappableGameEntity {
  private readonly WINDOW_WIDTH_RATIO = 0.85;
  private readonly WINDOW_HEIGHT = 400;
  private readonly TITLE_BAR_HEIGHT = 50;
  private readonly PADDING = 20;

  private backdropEntity: BackdropEntity;
  private closeButtonEntity: CloseButtonEntity;
  private leaveMatchButton: SmallButtonEntity;
  private playersListEntity: PlayersListEntity;

  private windowX = 0;
  private windowY = 0;
  private windowWidth = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly moderationService: PlayerModerationService,
    private readonly gamePointer: GamePointerContract,
    private readonly onClose: () => void,
    private readonly onLeaveMatch: () => void
  ) {
    super(false);
    this.opacity = 0;

    // Create subentities
    this.backdropEntity = new BackdropEntity(canvas);
    this.closeButtonEntity = new CloseButtonEntity(0, 0);
    this.leaveMatchButton = new SmallButtonEntity(
      "Leave match",
      140,
      40,
      "#e74c3c", // Red background
      "#7ed321" // Green hover color
    );
    this.playersListEntity = new PlayersListEntity();

    this.calculateLayout();
  }

  public override load(): void {
    this.backdropEntity.load();
    this.closeButtonEntity.load();
    this.leaveMatchButton.load();
    this.playersListEntity.load();
    super.load();
  }

  public show(): void {
    this.setActive(true);
    this.opacity = 1;
  }

  public close(): void {
    this.setActive(false);
    this.opacity = 0;
  }

  public setPlayers(players: GamePlayer[], localPlayerId: string): void {
    this.playersListEntity.setPlayers(
      players,
      localPlayerId,
      this.windowX + this.PADDING,
      this.windowY + this.TITLE_BAR_HEIGHT + 45,
      this.windowWidth - this.PADDING * 2,
      this.gamePointer,
      (playerId: string, reason: string) =>
        this.handlePlayerReport(playerId, reason),
      this.canvas
    );
  }

  private calculateLayout(): void {
    this.windowWidth = this.canvas.width * this.WINDOW_WIDTH_RATIO;
    this.windowX = (this.canvas.width - this.windowWidth) / 2;
    this.windowY = (this.canvas.height - this.WINDOW_HEIGHT) / 2;

    // Position close button
    this.closeButtonEntity.setPosition(
      this.windowX + this.windowWidth - 45,
      this.windowY + 7
    );
    // Position leave match button at bottom of window
    this.leaveMatchButton.setPosition(
      this.windowX + this.windowWidth / 2 - 70, // Centered (half of button width)
      this.windowY + this.WINDOW_HEIGHT - 60
    );
  }

  private handlePlayerReport(playerId: string, reason: string): void {
    // Report the player
    this.moderationService
      .reportUser(playerId, reason, false)
      .catch((error) => {
        console.error("Failed to report user:", error);
      });

    // Close the menu after reporting
    this.onClose();
  }

  public override handlePointerEvent(gamePointer: GamePointerContract): void {
    // Only handle pointer events if active and visible
    if (!this.active || this.opacity === 0) {
      return;
    }

    // Check if report menu is open
    if (this.playersListEntity.isReportMenuOpen()) {
      this.playersListEntity.handlePointerEvent(gamePointer);
      this.hovering = true;
      return;
    }

    // Forward pointer events to subentities
    this.closeButtonEntity.handlePointerEvent(gamePointer);
    this.leaveMatchButton.handlePointerEvent(gamePointer);
    this.playersListEntity.handlePointerEvent(gamePointer);

    // Check if any subentity captured the event
    if (
      this.closeButtonEntity.isHovering() ||
      this.closeButtonEntity.isPressed() ||
      this.leaveMatchButton.isHovering() ||
      this.leaveMatchButton.isPressed()
    ) {
      // Subentity handled it, we're done
      return;
    }

    // No subentity handled it, let base class handle it (for backdrop click detection if needed)
    super.handlePointerEvent(gamePointer);
  }

  public override update(delta: DOMHighResTimeStamp): void {
    if (this.playersListEntity.isReportMenuOpen()) {
      this.playersListEntity.update(delta);
      super.update(delta);
      return;
    }

    // Check if close button was pressed BEFORE updating subentities
    if (this.closeButtonEntity.isPressed()) {
      this.onClose();
    }

    // Check if leave match button was pressed BEFORE updating subentities
    if (this.leaveMatchButton.isButtonPressed()) {
      console.log("Leave match requested");
      this.onLeaveMatch();
      this.onClose();
    }

    // Update subentities (this resets their pressed state)
    this.backdropEntity.update(delta);
    this.closeButtonEntity.update(delta);
    this.leaveMatchButton.update(delta);
    this.playersListEntity.update(delta);

    super.update(delta);
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0) {
      return;
    }

    context.save();
    context.globalAlpha = this.opacity;

    // Render backdrop
    this.backdropEntity.render(context);

    // Render window background
    this.renderWindow(context);

    // Render title bar
    this.renderTitleBar(context);

    // Render close button
    this.closeButtonEntity.render(context);

    // Render leave match button
    this.leaveMatchButton.render(context);

    // Render players list
    this.playersListEntity.render(context);

    context.restore();
    super.render(context);
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
      this.windowWidth,
      this.WINDOW_HEIGHT,
      12 // Increased border radius
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
    context.lineTo(this.windowX + this.windowWidth - radius, this.windowY);
    context.quadraticCurveTo(
      this.windowX + this.windowWidth,
      this.windowY,
      this.windowX + this.windowWidth,
      this.windowY + radius
    );
    context.lineTo(
      this.windowX + this.windowWidth,
      this.windowY + this.TITLE_BAR_HEIGHT
    );
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
      this.windowWidth,
      this.TITLE_BAR_HEIGHT
    );

    context.restore();

    // Title text with slight shadow for better readability
    context.save();
    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 2;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.font = "bold 24px system-ui";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
      "Match menu",
      this.windowX + this.PADDING,
      this.windowY + this.TITLE_BAR_HEIGHT / 2 + 2
    );
    context.restore();
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
