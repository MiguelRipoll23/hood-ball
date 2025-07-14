import { CloseableMessageEntity } from "../../../entities/common/closeable-message-entity.js";
import { MenuOptionEntity } from "../../../entities/common/menu-option-entity.js";
import { OnlinePlayersEntity } from "../../../entities/online-players-entity.js";
import { ServerMessageWindowEntity } from "../../../entities/server-message-window-entity.js";
import { APIService } from "../../../services/network/api-service.js";
import type { MessagesResponse } from "../../../interfaces/responses/messages-response.js";
import { BaseGameScene } from "../../../../core/scenes/base-game-scene.js";
import { LoadingScene } from "../../loading/loading-scene.js";
import { ScoreboardScene } from "../scoreboard/scoreboard-scene.js";
import { SettingsScene } from "../settings-scene.js";
import { EventType } from "../../../enums/event-type.js";
import type { GameState } from "../../../../core/models/game-state.js";
import type { OnlinePlayersPayload } from "../../../interfaces/events/online-players-payload.js";
import { container } from "../../../../core/services/di-container.js";
import { EventConsumerService } from "../../../../core/services/gameplay/event-consumer-service.js";
import { MainMenuEntityFactory } from "./main-menu-entity-factory.js";
import type { MainMenuEntities } from "./main-menu-entity-factory.js";
import { MainMenuController } from "./main-menu-controller.js";
import { WebSocketService } from "../../../services/network/websocket-service.js";

export class MainMenuScene extends BaseGameScene {
  private MENU_OPTIONS_TEXT: string[] = ["Join game", "Scoreboard", "Settings"];

  private controller: MainMenuController;
  private entities: MainMenuEntities | null = null;

  private messagesResponse: MessagesResponse[] | null = null;

  private serverMessageWindowEntity: ServerMessageWindowEntity | null = null;
  private closeableMessageEntity: CloseableMessageEntity | null = null;
  private onlinePlayersEntity: OnlinePlayersEntity | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    private showNews: boolean
  ) {
    super(gameState, eventConsumerService);
    this.showNews = showNews;
    const apiService = container.get(APIService);
    this.controller = new MainMenuController(apiService);
    this.subscribeToEvents();
  }

  public override load(): void {
    const factory = new MainMenuEntityFactory(
      this.canvas,
      this.gameState,
      this.MENU_OPTIONS_TEXT
    );
    this.entities = factory.createEntities();

    const {
      titleEntity,
      menuOptionEntities,
      serverMessageWindowEntity,
      closeableMessageEntity,
      welcomeMessageEntity,
      onlinePlayersEntity,
    } = this.entities;

    this.serverMessageWindowEntity = serverMessageWindowEntity;
    this.closeableMessageEntity = closeableMessageEntity;
    this.onlinePlayersEntity = onlinePlayersEntity;

    const total = container.get(WebSocketService).getOnlinePlayers();
    this.onlinePlayersEntity.setOnlinePlayers(total);

    this.uiEntities.push(
      titleEntity,
      ...menuOptionEntities,
      welcomeMessageEntity,
      onlinePlayersEntity,
      serverMessageWindowEntity,
      closeableMessageEntity
    );

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
    this.enableMenuButtons();

    if (this.showNews) {
      this.downloadServerMessages();
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

  private showMessages(messages: MessagesResponse[]): void {
    if (messages.length === 0) {
      console.log("No server messages to show");
      return;
    }

    this.messagesResponse = messages;
    this.showNews = false;
    this.showMessage(0);
  }

  private showMessage(index: number): void {
    if (this.messagesResponse === null) {
      return;
    }

    if (index === this.messagesResponse.length) {
      if (this.serverMessageWindowEntity?.isOpened()) {
        this.serverMessageWindowEntity?.closeAll();
      }

      return;
    }

    const item = this.messagesResponse[index];
    const length = this.messagesResponse.length;

    this.serverMessageWindowEntity?.openMessage(
      index,
      length,
      item.title,
      item.content
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

  private enableMenuButtons(): void {
    this.uiEntities.forEach((uiEntity) => {
      if (uiEntity instanceof MenuOptionEntity) {
        uiEntity.setActive(true);
      }
    });
  }

  private disableMenuButtons(): void {
    this.uiEntities.forEach((uiEntity) => {
      if (uiEntity instanceof MenuOptionEntity) {
        uiEntity.setActive(false);
      }
    });
  }

  public override resubscribeEvents(): void {
    this.subscribeToEvents();
  }


  private handleOnlinePlayersEvent(payload: OnlinePlayersPayload): void {
    this.onlinePlayersEntity?.setOnlinePlayers(payload.total);
  }

}
