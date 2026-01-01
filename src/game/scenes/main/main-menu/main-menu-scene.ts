import { CloseableMessageEntity } from "../../../entities/common/closeable-message-entity.js";
import { MenuOptionEntity } from "../../../entities/common/menu-option-entity.js";
import { OnlinePlayersEntity } from "../../../entities/online-players-entity.js";
import { ServerMessageWindowEntity } from "../../../entities/server-message-window-entity.js";
import { APIService } from "../../../services/network/api-service.js";
import type { ServerMessagesResponse } from "../../../interfaces/responses/server-messages-response-interface.js";
import { BaseGameScene } from "../../../../engine/scenes/base-game-scene.js";
import { LoadingScene } from "../../loading/loading-scene.js";
import { ScoreboardScene } from "../scoreboard/scoreboard-scene.js";
import { SettingsScene } from "../settings-scene.js";
import { EventType } from "../../../../engine/enums/event-type.js";
import type { GameState } from "../../../../engine/models/game-state.js";
import type { OnlinePlayersPayload } from "../../../interfaces/events/online-players-payload-interface.js";
import type { ServerDisconnectedPayload } from "../../../interfaces/events/server-disconnected-payload-interface.js";
import { container } from "../../../../engine/services/di-container.js";
import { EventConsumerService } from "../../../../engine/services/gameplay/event-consumer-service.js";
import { MainMenuEntityFactory } from "./main-menu-entity-factory.js";
import type { MainMenuEntities } from "./main-menu-entity-factory.js";
import { MainMenuController } from "./main-menu-controller.js";
import { GameServer } from "../../../models/game-server.js";
import { ToastEntity } from "../../../entities/common/toast-entity.js";
import { gameContext } from "../../../context/game-context.js";
import { WebSocketService } from "../../../services/network/websocket-service.js";
import { SceneTransitionUtils } from "../../../utils/scene-transition-utils.js";

export class MainMenuScene extends BaseGameScene {
  private MENU_OPTIONS_TEXT: string[] = ["Join game", "Scoreboard", "Settings"];
  private ONLINE_REQUIRED_BUTTONS: Set<number> = new Set([0, 1]); // Join game and Scoreboard buttons require online connection

  private controller: MainMenuController;
  private entities: MainMenuEntities | null = null;

  private serverMessagesResponse: ServerMessagesResponse | null = null;

  private serverMessageWindowEntity: ServerMessageWindowEntity | null = null;
  private closeableMessageEntity: CloseableMessageEntity | null = null;
  private onlinePlayersEntity: OnlinePlayersEntity | null = null;
  private toastEntity: ToastEntity | null = null;
  private pendingMessage: string | null = null;
  private readonly gameServer: GameServer;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    private showNews: boolean
  ) {
    super(gameState, eventConsumerService);
    this.gameServer = gameContext.get(GameServer);
    this.showNews = showNews;
    const apiService = container.get(APIService);
    this.controller = new MainMenuController(apiService);
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new MainMenuEntityFactory(
      this.canvas,
      this.MENU_OPTIONS_TEXT,
      this.ONLINE_REQUIRED_BUTTONS
    );
    this.entities = factory.createEntities();

    const {
      titleEntity,
      menuOptionEntities,
      serverMessageWindowEntity,
      closeableMessageEntity,
      welcomeMessageEntity,
      onlinePlayersEntity,
      toastEntity,
    } = this.entities;

    this.serverMessageWindowEntity = serverMessageWindowEntity;
    this.closeableMessageEntity = closeableMessageEntity;
    this.onlinePlayersEntity = onlinePlayersEntity;
    this.toastEntity = toastEntity;

    const total = container.get(WebSocketService).getOnlinePlayers();
    this.onlinePlayersEntity.setOnlinePlayers(total);

    this.uiEntities.push(
      titleEntity,
      ...menuOptionEntities,
      welcomeMessageEntity,
      onlinePlayersEntity,
      serverMessageWindowEntity,
      closeableMessageEntity,
      toastEntity
    );

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
    this.updateMenuButtonsConnectionState();

    if (this.showNews) {
      this.downloadServerMessages();
    }

    if (this.pendingMessage) {
      this.closeableMessageEntity?.show(this.pendingMessage);
      this.pendingMessage = null;
    }
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.handleMenuOptionEntities();
    this.handleServerMessageWindowEntity();

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    super.render(context);
  }

  private subscribeToEvents(): void {
    this.subscribeToLocalEvents();
  }

  private subscribeToLocalEvents(): void {
    this.subscribeToLocalEvent(
      EventType.DebugChanged,
      this.updateDebugStateForEntities.bind(this)
    );
    this.subscribeToLocalEvent(
      EventType.OnlinePlayers,
      this.handleOnlinePlayersEvent.bind(this)
    );

    this.subscribeToLocalEvent(
      EventType.ServerDisconnected,
      this.handleServerDisconnectedEvent.bind(this)
    );

    this.subscribeToLocalEvent(
      EventType.ServerConnected,
      this.handleServerConnectedEvent.bind(this)
    );

    this.subscribeToLocalEvent(
      EventType.UserBannedByServer,
      this.handleUserBannedByServerEvent.bind(this)
    );
  }

  private downloadServerMessages(): void {
    this.controller
      .fetchServerMessages()
      .then((messages) => {
        this.showMessages(messages);
      })
      .catch((error) => {
        console.error(error);
        this.closeableMessageEntity?.show("Failed to download server messages");
      });
  }

  private showMessages(messagesResponse: ServerMessagesResponse): void {
    if (messagesResponse.results.length === 0) {
      console.log("No server messages to show");
      return;
    }

    this.serverMessagesResponse = messagesResponse;
    this.showNews = false;
    this.showMessage(0);
  }

  private showMessage(index: number): void {
    const messagesResponse = this.serverMessagesResponse;

    if (!messagesResponse || messagesResponse.results.length === 0) {
      return;
    }

    if (index === messagesResponse.results.length) {
      if (messagesResponse.nextCursor !== undefined) {
        this.controller
          .fetchServerMessages(messagesResponse.nextCursor)
          .then((response) => {
            messagesResponse.results.push(...response.results);
            messagesResponse.nextCursor = response.nextCursor;
            this.showMessage(index);
          })
          .catch((error) => {
            console.error(error);
            if (this.serverMessageWindowEntity?.isOpened()) {
              this.serverMessageWindowEntity.closeAll();
            }
          });
        return;
      }

      if (this.serverMessageWindowEntity?.isOpened()) {
        this.serverMessageWindowEntity.closeAll();
      }

      return;
    }

    const item = messagesResponse.results[index];
    const length = messagesResponse.results.length;

    this.serverMessageWindowEntity?.openMessage(
      index,
      length,
      item.title,
      item.content,
      item.createdAt
    );
  }

  private handleServerMessageWindowEntity() {
    if (this.serverMessageWindowEntity?.getNext()) {
      const index = this.serverMessageWindowEntity.getIndex() + 1;
      this.showMessage(index);
    }
  }

  private handleMenuOptionEntities(): void {
    this.uiEntities.forEach((uiEntity) => {
      if (uiEntity instanceof MenuOptionEntity && uiEntity.isPressed()) {
        this.handleMenuOption(uiEntity);
      }
    });
  }

  private handleMenuOption(menuOptionEntity: MenuOptionEntity): void {
    // Check if the button is inactive due to lack of online connection
    if (
      !menuOptionEntity.isActive() &&
      menuOptionEntity.getRequiresOnlineConnection()
    ) {
      this.closeableMessageEntity?.show(
        "This feature requires an online connection"
      );
      return;
    }

    const index = menuOptionEntity.getIndex();

    switch (index) {
      case 0:
        this.transitionToLoadingScene();
        break;

      case 1:
        this.transitionToScoreboardScene();
        break;

      case 2:
        this.transitionToSettingsScene();
        break;

      default:
        this.closeableMessageEntity?.show("Invalid menu option");
    }
  }

  private transitionToLoadingScene(): void {
    this.disableMenuButtons();

    const loadingScene = new LoadingScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    loadingScene.load();

    this.sceneManagerService
      ?.getTransitionService()
      .crossfade(this.sceneManagerService, loadingScene, 0.2);
  }

  private transitionToScoreboardScene(): void {
    this.disableMenuButtons();

    const scoreboardScene = new ScoreboardScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    scoreboardScene.load();

    this.sceneManagerService
      ?.getTransitionService()
      .crossfade(this.sceneManagerService, scoreboardScene, 0.2);
  }

  private transitionToSettingsScene(): void {
    this.disableMenuButtons();

    const settingsScene = new SettingsScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    settingsScene.load();

    this.sceneManagerService
      ?.getTransitionService()
      .crossfade(this.sceneManagerService, settingsScene, 0.2);
  }

  private transitionToLoginScene(): void {
    if (!this.sceneManagerService) {
      console.error("Cannot transition to login scene: sceneManagerService is null");
      return;
    }

    SceneTransitionUtils.transitionToLoginScene({
      sceneManager: this.sceneManagerService,
      errorMessage: "You have been banned from the server"
    });
  }

  private updateMenuButtonsConnectionState(): void {
    const isConnected = this.gameServer.isConnected();

    this.uiEntities.forEach((uiEntity) => {
      if (uiEntity instanceof MenuOptionEntity) {
        if (uiEntity.getRequiresOnlineConnection()) {
          // Set active state based on connection status for online-required buttons
          uiEntity.setActive(isConnected);
        } else {
          // Always keep offline buttons active
          uiEntity.setActive(true);
        }
      }
    });
  }

  private enableMenuButtons(): void {
    // Update button states based on current connection status
    this.updateMenuButtonsConnectionState();
  }

  private disableMenuButtons(): void {
    // Update button states based on current connection status
    this.updateMenuButtonsConnectionState();
  }

  public override resubscribeEvents(): void {
    this.subscribeToEvents();
  }

  public setPendingMessage(message: string): void {
    this.pendingMessage = message;
  }

  public startServerReconnection(): void {
    // The WebSocket service now handles reconnection automatically
    // Just show the reconnecting message to the user
    this.toastEntity?.show("Reconnecting to game server...");
    this.disableMenuButtons();
  }

  private handleServerDisconnectedEvent(
    payload: ServerDisconnectedPayload
  ): void {
    if (!payload.connectionLost) {
      return;
    }
    this.disableMenuButtons();
    this.startServerReconnection();
  }

  private handleServerConnectedEvent(): void {
    this.toastEntity?.hide();
    this.enableMenuButtons();
  }

  private handleUserBannedByServerEvent(): void {
    console.log("User banned by server, transitioning to login scene");
    this.transitionToLoginScene();
  }

  private handleOnlinePlayersEvent(payload: OnlinePlayersPayload): void {
    this.onlinePlayersEntity?.setOnlinePlayers(payload.total);
  }
}
