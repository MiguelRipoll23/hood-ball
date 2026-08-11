import { BackdropEntity } from "../entities/common/backdrop-entity.js";
import { CloseButtonEntity } from "../entities/close-button-entity.js";
import { SmallButtonEntity } from "../entities/common/small-button-entity.js";
import { PlayersListEntity } from "../entities/players-list-entity.js";
import { MatchWindowElement } from "../entities/match-menu/elements/match-window-element.js";
import { MatchTitleBarElement } from "../entities/match-menu/elements/match-title-bar-element.js";
import { ConfirmationMessageEntity } from "../entities/common/confirmation-message-entity.js";
import { CloseableMessageEntity } from "../entities/common/closeable-message-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { PlayerModerationService } from "../services/network/player-moderation-service.js";
import type { APIService } from "../services/network/api-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

const WINDOW_WIDTH_RATIO = 0.85;
const WINDOW_HEIGHT = 400;
const TITLE_BAR_HEIGHT = 50;
const PADDING = 20;

/**
 * Script behaviour for the match menu overlay. Orchestrates the
 * backdrop, close button, leave-match button, player list, window/title
 * elements, and confirmation/message dialogs. Implements the
 * confirmation → action → result state machine.
 * Attached to MatchMenuEntity via ScriptComponent.
 */
export class MatchMenuScript {
  // ── Child entities ────────────────────────────────────────────
  private backdropEntity: BackdropEntity;
  private closeButtonEntity: CloseButtonEntity;
  private leaveMatchButton: SmallButtonEntity;
  private playersListEntity: PlayersListEntity;
  private windowElement: MatchWindowElement;
  private titleBarElement: MatchTitleBarElement;
  private confirmationEntity: ConfirmationMessageEntity;
  private messageEntity: CloseableMessageEntity;

  // ── Layout ────────────────────────────────────────────────────
  private windowX = 0;
  private windowY = 0;
  private windowWidth = 0;

  // ── State machine ─────────────────────────────────────────────
  private pendingAction: (() => void) | null = null;
  pendingClose = false;

  /** Exposed for the entity to report to the scene's tappable loop. */
  isHovering = false;
  isPressed = false;

  // ── Misc ──────────────────────────────────────────────────────
  private onClose: () => void;
  private onLeaveMatch: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly moderationService: PlayerModerationService,
    private readonly apiService: APIService,
    private readonly gamePointer: GamePointerContract,
    onClose: () => void,
    onLeaveMatch: () => void,
  ) {
    this.onClose = onClose;
    this.onLeaveMatch = onLeaveMatch;

    this.backdropEntity = new BackdropEntity(canvas);
    this.closeButtonEntity = new CloseButtonEntity(0, 0);
    this.leaveMatchButton = new SmallButtonEntity(
      "Leave match", 140, 40, "#e74c3c", "#7ed321",
    );
    this.playersListEntity = new PlayersListEntity(this.apiService);
    this.windowElement = new MatchWindowElement(0, 0, 0, WINDOW_HEIGHT);
    this.titleBarElement = new MatchTitleBarElement(0, 0, 0, TITLE_BAR_HEIGHT, PADDING);
    this.confirmationEntity = new ConfirmationMessageEntity(canvas);
    this.messageEntity = new CloseableMessageEntity(canvas);

    this.calculateLayout();
  }

  // ── Lifecycle (called directly by entity, not via ScriptComponent)

  load(): void {
    this.backdropEntity.load();
    this.closeButtonEntity.load();
    this.leaveMatchButton.load();
    this.playersListEntity.load();
    this.windowElement.load();
    this.titleBarElement.load();
    this.confirmationEntity.load();
    this.messageEntity.load();
  }

  update(delta: DOMHighResTimeStamp): void {
    if (this.pendingClose) {
      this.messageEntity.update(delta);
      if (!this.messageEntity.isActive()) {
        this.pendingClose = false;
        this.onClose();
      }
      return;
    }

    if (this.confirmationEntity.isOpen()) {
      this.confirmationEntity.update(delta);

      if (this.confirmationEntity.isConfirmed()) {
        this.confirmationEntity.close();
        this.pendingAction?.();
        this.pendingAction = null;
      } else if (this.confirmationEntity.isCancelled()) {
        this.confirmationEntity.close();
        this.pendingAction = null;
      }
      return;
    }

    if (this.playersListEntity.isActionMenuOpen()) {
      this.playersListEntity.update(delta);
      return;
    }

    if (this.closeButtonEntity.isPressed()) {
      this.onClose();
    }

    if (this.leaveMatchButton.isButtonPressed()) {
      EngineLogger.info("MatchMenuEntity", "Leave match requested");
      this.onLeaveMatch();
      this.onClose();
    }

    this.backdropEntity.update(delta);
    this.closeButtonEntity.update(delta);
    this.leaveMatchButton.update(delta);
    this.playersListEntity.update(delta);
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    this.backdropEntity.render(context);
    this.windowElement.render(context);
    this.titleBarElement.render(context);
    this.closeButtonEntity.render(context);
    this.leaveMatchButton.render(context);
    this.playersListEntity.render(context);

    if (this.confirmationEntity.isOpen()) {
      this.confirmationEntity.render(context);
    }

    if (this.pendingClose) {
      this.messageEntity.render(context);
    }
    context.restore();
  }

  // ── Public API for entity ────────────────────────────────────

  setPlayers(
    players: GamePlayer[],
    localPlayerId: string,
  ): void {
    this.playersListEntity.setPlayers(
      players, localPlayerId,
      this.windowX + PADDING,
      this.windowY + TITLE_BAR_HEIGHT + 45,
      this.windowWidth - PADDING * 2,
      this.gamePointer,
      (playerId: string, reason: string, playerName: string) =>
        this.handlePlayerReport(playerId, reason, playerName),
      (
        playerId: string, reason: string, playerName: string,
        duration?: { value: number; unit: string },
      ) => this.handlePlayerBan(playerId, reason, playerName, duration),
      this.canvas,
    );
  }

  handlePointerEvent(gamePointer: GamePointerContract, entityOpacity: number): void {
    if (entityOpacity === 0) return;

    // Reset per-frame state (called before child entities are updated)
    this.isHovering = false;
    this.isPressed = false;

    if (this.pendingClose && this.messageEntity.isActive()) {
      this.messageEntity.handlePointerEvent(gamePointer);
      this.isHovering = true;
      return;
    }

    if (this.confirmationEntity.isOpen()) {
      this.confirmationEntity.handlePointerEvent(gamePointer);
      this.isHovering = true;
      return;
    }

    if (this.playersListEntity.isActionMenuOpen()) {
      this.playersListEntity.handlePointerEvent(gamePointer);
      this.isHovering = true;
      return;
    }

    this.closeButtonEntity.handlePointerEvent(gamePointer);
    this.leaveMatchButton.handlePointerEvent(gamePointer);
    this.playersListEntity.handlePointerEvent(gamePointer);

    if (
      this.closeButtonEntity.isHovering() ||
      this.closeButtonEntity.isPressed() ||
      this.leaveMatchButton.isHovering() ||
      this.leaveMatchButton.isPressed()
    ) {
      this.isHovering = this.closeButtonEntity.isHovering() || this.leaveMatchButton.isHovering();
      this.isPressed = this.closeButtonEntity.isPressed() || this.leaveMatchButton.isPressed();
      return;
    }
  }

  // ── Layout ───────────────────────────────────────────────────

  private calculateLayout(): void {
    this.windowWidth = this.canvas.width * WINDOW_WIDTH_RATIO;
    this.windowX = (this.canvas.width - this.windowWidth) / 2;
    this.windowY = (this.canvas.height - WINDOW_HEIGHT) / 2;

    this.windowElement.setLayout(this.windowX, this.windowY, this.windowWidth);
    this.titleBarElement.setLayout(this.windowX, this.windowY, this.windowWidth);

    this.closeButtonEntity.setPosition(
      this.windowX + this.windowWidth - 45, this.windowY + 5,
    );
    this.leaveMatchButton.setPosition(
      this.windowX + this.windowWidth / 2 - 70,
      this.windowY + WINDOW_HEIGHT - 57,
    );
  }

  // ── Report / Ban handlers ────────────────────────────────────

  private handlePlayerReport(playerId: string, reason: string, playerName: string): void {
    this.pendingAction = () => {
      this.moderationService
        .reportUser(playerId, reason, false)
        .then(() => { this.messageEntity.show("Report sent"); this.pendingClose = true; })
        .catch((error) => {
          EngineLogger.error("MatchMenuEntity", "Failed to report user:", error);
          this.messageEntity.show("Failed to report player");
          this.pendingClose = true;
        });
    };
    this.confirmationEntity.show(
      `Are you sure you want to report ${playerName}?`,
    );
  }

  private handlePlayerBan(
    playerId: string, reason: string, playerName: string,
    duration?: { value: number; unit: string },
  ): void {
    this.pendingAction = () => {
      this.moderationService
        .banUser(playerId, reason, duration)
        .then(() => { this.messageEntity.show("User banned"); this.pendingClose = true; })
        .catch((error) => {
          EngineLogger.error("MatchMenuEntity", "Failed to ban user:", error);
          this.messageEntity.show("Failed to ban player");
          this.pendingClose = true;
        });
    };
    this.confirmationEntity.show(
      `Are you sure you want to ban ${playerName}?`,
    );
  }
}
