import { ChatButtonEntity } from "../../../entities/chat-button-entity.js";
import { MatchMenuButtonEntity } from "../../../entities/match-menu-button-entity.js";
import { MatchMenuEntity } from "../../../entities/match-menu-entity.js";
import { BoostMeterEntity } from "../../../entities/boost-meter-entity.js";
import { HelpEntity } from "../../../entities/help-entity.js";
import type { GamePlayer } from "../../../models/game-player.js";
import type { MatchSessionService } from "../../../services/session/match-session-service.js";
import { ChatService } from "../../../services/network/chat-service.js";
import { PlayerModerationService } from "../../../services/network/player-moderation-service.js";
import { APIService } from "../../../services/network/api-service.js";
import type { GamePointerContract } from "../../../../engine/interfaces/input/game-pointer-interface.js";
import type { GameKeyboardContract } from "../../../../engine/interfaces/input/game-keyboard-interface.js";
import type { GameEntity } from "../../../../engine/models/game-entity.js";
import type { MatchmakingServiceContract } from "../../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { EngineLogger } from "../../../../engine/services/engine-logger.js";

/**
 * Manages chat UI and match menu setup for the world scene.
 * Extracted from WorldScene to reduce its size and improve cohesion.
 */
export class ChatUISystem {
  private chatButtonEntity: ChatButtonEntity | null = null;
  private matchMenuButtonEntity: MatchMenuButtonEntity | null = null;
  private matchMenuEntity: MatchMenuEntity | null = null;

  /**
   * Set up chat UI: makes chat input visible, creates chat button,
   * loads initial messages, and wires the match menu.
   */
  public setup(
    canvas: HTMLCanvasElement,
    boostMeterEntity: BoostMeterEntity,
    helpEntity: HelpEntity,
    chatService: ChatService,
    gamePointer: GamePointerContract,
    gameKeyboard: GameKeyboardContract,
    playerModerationService: PlayerModerationService,
    apiService: APIService,
    matchmakingService: MatchmakingServiceContract | null,
    uiEntities: GameEntity[],
    onReturnToMainMenu: () => Promise<void>,
  ): ChatButtonEntity | null {
    const chatInputElement = document.querySelector(
      "#chat-input",
    ) as HTMLInputElement | null;

    if (!chatInputElement) {
      EngineLogger.error("ChatUiSystem", "Chat input element not found");
      return null;
    }

    chatInputElement.removeAttribute("hidden");

    this.chatButtonEntity = new ChatButtonEntity(
      boostMeterEntity,
      chatInputElement,
      chatService,
      gamePointer,
      gameKeyboard,
      helpEntity,
    );
    uiEntities.push(this.chatButtonEntity);

    // Set up match menu
    this.matchMenuEntity = new MatchMenuEntity(
      canvas,
      playerModerationService,
      apiService,
      gamePointer,
      () => this.hideMatchMenu(),
      async () => {
        try {
          if (matchmakingService) {
            await matchmakingService.leaveMatch();
          }
        } catch (error) {
          EngineLogger.error("ChatUiSystem", "Error leaving match:", error);
        } finally {
          await onReturnToMainMenu();
        }
      },
    );
    this.matchMenuEntity.setOpacity(0);
    uiEntities.push(this.matchMenuEntity);

    // Create match menu button
    this.matchMenuButtonEntity = new MatchMenuButtonEntity(
      boostMeterEntity,
      helpEntity,
    );
    this.matchMenuButtonEntity.setOnToggleMenu(() => this.toggleMatchMenu());
    uiEntities.push(this.matchMenuButtonEntity);

    return this.chatButtonEntity;
  }

  /** Refresh player list in the match menu. */
  public refreshPlayers(
    matchSessionService: MatchSessionService,
    gamePlayer: GamePlayer,
  ): void {
    if (!this.matchMenuEntity) return;
    const match = matchSessionService.getMatch();
    if (match) {
      this.matchMenuEntity.setPlayers(match.getPlayers(), gamePlayer.getNetworkId());
    }
  }

  /** Hide chat input when leaving scene. */
  public dispose(): void {
    const chatInputElement = document.querySelector(
      "#chat-input",
    ) as HTMLInputElement | null;
    if (chatInputElement) {
      chatInputElement.setAttribute("hidden", "");
    }
  }

  public getChatButton(): ChatButtonEntity | null {
    return this.chatButtonEntity;
  }

  private toggleMatchMenu(): void {
    if (!this.matchMenuEntity || !this.matchMenuButtonEntity) return;

    const isVisible = this.matchMenuEntity.getOpacity() > 0;
    if (isVisible) {
      this.hideMatchMenu();
    } else {
      this.showMatchMenu();
    }
  }

  private showMatchMenu(): void {
    if (!this.matchMenuEntity || !this.matchMenuButtonEntity) return;
    this.matchMenuEntity.show();
    this.matchMenuButtonEntity.setMenuVisible(true);
    this.matchMenuButtonEntity.setActive(false);
  }

  private hideMatchMenu(): void {
    if (!this.matchMenuEntity || !this.matchMenuButtonEntity) return;
    this.matchMenuEntity.close();
    this.matchMenuButtonEntity.setMenuVisible(false);
    this.matchMenuButtonEntity.setActive(true);
  }
}
