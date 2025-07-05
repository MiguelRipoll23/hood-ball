import { CloseableMessageEntity } from "../../entities/common/closeable-message-entity.js";
import { MenuOptionEntity } from "../../entities/common/menu-option-entity.js";
import { TitleEntity } from "../../entities/common/title-entity.js";
import { ServerMessageWindowEntity } from "../../entities/server-message-window-entity.js";
import { APIService } from "../../services/network/api-service.js";
import type { MessagesResponse } from "../../interfaces/responses/messages-response.js";
import { BaseGameScene } from "../../../core/scenes/base-game-scene.js";
import { LoadingScene } from "../loading/loading-scene.js";
import { ScoreboardScene } from "./scoreboard-scene.js";
import { SettingsScene } from "./settings-scene.js";
import { EventType } from "../../enums/event-type.js";
import type { GameState } from "../../../core/models/game-state.js";
import { container } from "../../../core/services/di-container.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";

export class MainMenuScene extends BaseGameScene {
  private MENU_OPTIONS_TEXT: string[] = ["Join game", "Scoreboard", "Settings"];

  private apiService: APIService;

  private messagesResponse: MessagesResponse[] | null = null;

  private serverMessageWindowEntity: ServerMessageWindowEntity | null = null;
  private closeableMessageEntity: CloseableMessageEntity | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    private showNews: boolean
  ) {
    super(gameState, eventConsumerService);
    this.showNews = showNews;
    this.apiService = container.get(APIService);
    this.subscribeToEvents();
  }

  public override load(): void {
    this.loadTitleEntity();
    this.loadMenuOptionEntities();
    this.loadServerMessageWindow();
    this.loadCloseableMessageEntity();

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
    context.globalAlpha = this.opacity;
    this.showWelcomePlayerName(context);
    context.globalAlpha = 1;
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
  }

  private loadTitleEntity(): void {
    const titleEntity = new TitleEntity();
    titleEntity.setText("MAIN MENU");
    this.uiEntities.push(titleEntity);
  }

  private loadMenuOptionEntities(): void {
    let y = 100;

    for (let index = 0; index < this.MENU_OPTIONS_TEXT.length; index++) {
      const text = this.MENU_OPTIONS_TEXT[index];

      const menuOptionEntity = new MenuOptionEntity(this.canvas, index, text);
      menuOptionEntity.setPosition(30, y);

      this.uiEntities.push(menuOptionEntity);

      y += menuOptionEntity.getHeight() + 30;
    }
  }

  private loadCloseableMessageEntity(): void {
    this.closeableMessageEntity = new CloseableMessageEntity(this.canvas);
    this.uiEntities.push(this.closeableMessageEntity);
  }

  private loadServerMessageWindow(): void {
    this.serverMessageWindowEntity = new ServerMessageWindowEntity(this.canvas);
    this.serverMessageWindowEntity.load();

    this.uiEntities.push(this.serverMessageWindowEntity);
  }

  private downloadServerMessages(): void {
    this.apiService
      .getMessages()
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
      return console.log("No server messages to show");
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
        return this.transitionToScoreboardScene();

      case 2:
        return this.transitionToSettingsScene();

      default:
        return this.closeableMessageEntity?.show("Invalid menu option");
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

  private showWelcomePlayerName(context: CanvasRenderingContext2D): void {
    const playerName = this.gameState.getGamePlayer()?.getName() || "Unknown";

    // Draw text that says Hello
    context.font = "bold 28px system-ui";
    context.fillStyle = "white";
    context.textAlign = "center";

    context.fillText(
      "HEY, YOU!",
      this.canvas.width / 2,
      this.canvas.height - 140
    );

    context.fillStyle = "#7ed321";

    context.fillText(
      `${playerName}`,
      this.canvas.width / 2,
      this.canvas.height - 100
    );
  }
}
