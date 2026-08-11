import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BackdropEntity } from "./common/backdrop-entity.js";
import { CloseButtonEntity } from "./close-button-entity.js";
import { SmallButtonEntity } from "./common/small-button-entity.js";
import { PlayersListEntity } from "./players-list-entity.js";
import { MatchWindowElement } from "./match-menu/elements/match-window-element.js";
import { MatchTitleBarElement } from "./match-menu/elements/match-title-bar-element.js";
import { CloseableMessageEntity } from "./common/closeable-message-entity.js";
import { ConfirmationMessageEntity } from "./common/confirmation-message-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { PlayerModerationService } from "../services/network/player-moderation-service.js";
import type { APIService } from "../services/network/api-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";
import { InputComponent } from "../../engine/components/input-component.js";

export class MatchMenuEntity extends BaseGameEntity {
  private readonly WINDOW_WIDTH_RATIO = 0.85;
  private readonly WINDOW_HEIGHT = 400;
  private readonly TITLE_BAR_HEIGHT = 50;
  private readonly PADDING = 20;

  private readonly backdropEntity: BackdropEntity;
  private readonly closeButtonEntity: CloseButtonEntity;
  private readonly leaveMatchButton: SmallButtonEntity;
  private readonly playersListEntity: PlayersListEntity;
  private readonly windowElement: MatchWindowElement;
  private readonly titleBarElement: MatchTitleBarElement;
  private readonly confirmationEntity: ConfirmationMessageEntity;
  private readonly messageEntity: CloseableMessageEntity;

  private windowX = 0;
  private windowY = 0;
  private windowWidth = 0;

  // Stores the API call to execute if the user confirms
  private pendingAction: (() => void) | null = null;
  // True while waiting for the user to dismiss the result message
  private pendingClose = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly moderationService: PlayerModerationService,
    private readonly apiService: APIService,
    private readonly gamePointer: GamePointerContract,
    private readonly onClose: () => void,
    private readonly onLeaveMatch: () => void
  ) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new ScriptComponent({ update: (dt) => this.scriptUpdate(dt), render: (ctx) => this.scriptRender(ctx) }));
    this.opacity = 0;

    this.backdropEntity = new BackdropEntity(canvas);
    this.closeButtonEntity = new CloseButtonEntity(0, 0);
    this.leaveMatchButton = new SmallButtonEntity(
      "Leave match",
      140,
      40,
      "#e74c3c",
      "#7ed321"
    );
    this.playersListEntity = new PlayersListEntity(this.apiService);
    this.windowElement = new MatchWindowElement(0, 0, 0, this.WINDOW_HEIGHT);
    this.titleBarElement = new MatchTitleBarElement(
      0,
      0,
      0,
      this.TITLE_BAR_HEIGHT,
      this.PADDING
    );
    this.confirmationEntity = new ConfirmationMessageEntity(canvas);
    this.messageEntity = new CloseableMessageEntity(canvas);

    this.calculateLayout();
  }

  public override load(): void {
    this.backdropEntity.load();
    this.closeButtonEntity.load();
    this.leaveMatchButton.load();
    this.playersListEntity.load();
    this.windowElement.load();
    this.titleBarElement.load();
    this.confirmationEntity.load();
    this.messageEntity.load();
    super.load();
  }

  public show(): void {
    this.getComponent(InputComponent)!.active = true;
    this.opacity = 1;
  }

  public close(): void {
    this.getComponent(InputComponent)!.active = false;
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
      (playerId: string, reason: string, playerName: string) =>
        this.handlePlayerReport(playerId, reason, playerName),
      (
        playerId: string,
        reason: string,
        playerName: string,
        duration?: { value: number; unit: string }
      ) => this.handlePlayerBan(playerId, reason, playerName, duration),
      this.canvas
    );
  }

  private calculateLayout(): void {
    this.windowWidth = this.canvas.width * this.WINDOW_WIDTH_RATIO;
    this.windowX = (this.canvas.width - this.windowWidth) / 2;
    this.windowY = (this.canvas.height - this.WINDOW_HEIGHT) / 2;

    this.windowElement.setLayout(this.windowX, this.windowY, this.windowWidth);
    this.titleBarElement.setLayout(
      this.windowX,
      this.windowY,
      this.windowWidth
    );

    this.closeButtonEntity.setPosition(
      this.windowX + this.windowWidth - 45,
      this.windowY + 5
    );
    this.leaveMatchButton.setPosition(
      this.windowX + this.windowWidth / 2 - 70,
      this.windowY + this.WINDOW_HEIGHT - 57
    );
  }

  private handlePlayerReport(playerId: string, reason: string, playerName: string): void {
    this.pendingAction = () => {
      this.moderationService
        .reportUser(playerId, reason, false)
        .then(() => {
          this.messageEntity.show("Report sent");
          this.pendingClose = true;
        })
        .catch((error) => {
          EngineLogger.error("MatchMenuEntity", "Failed to report user:", error);
          this.messageEntity.show("Failed to report player");
          this.pendingClose = true;
        });
    };

    this.confirmationEntity.show(`Are you sure you want to report ${playerName}?`);
  }

  private handlePlayerBan(
    playerId: string,
    reason: string,
    playerName: string,
    duration?: { value: number; unit: string }
  ): void {
    this.pendingAction = () => {
      this.moderationService
        .banUser(playerId, reason, duration)
        .then(() => {
          this.messageEntity.show("User banned");
          this.pendingClose = true;
        })
        .catch((error) => {
          EngineLogger.error("MatchMenuEntity", "Failed to ban user:", error);
          this.messageEntity.show("Failed to ban player");
          this.pendingClose = true;
        });
    };

    this.confirmationEntity.show(`Are you sure you want to ban ${playerName}?`);
  }

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    if (!this.getComponent(InputComponent)!.active || this.opacity === 0) {
      return;
    }

    if (this.pendingClose && this.messageEntity.isActive()) {
      this.messageEntity.handlePointerEvent(gamePointer);
      return;
    }

    if (this.confirmationEntity.isOpen()) {
      this.confirmationEntity.handlePointerEvent(gamePointer);
      return;
    }

    if (this.playersListEntity.isActionMenuOpen()) {
      this.playersListEntity.handlePointerEvent(gamePointer);
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
      return;
    }

    this.getComponent(InputComponent)!.handlePointerEvent(gamePointer);
  }

  private scriptUpdate(delta: DOMHighResTimeStamp): void {
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
        // Submenu stays open so user can pick a different reason
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

  private scriptRender(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0) {
      return;
    }

    context.save();
    context.globalAlpha = this.opacity;

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
}
