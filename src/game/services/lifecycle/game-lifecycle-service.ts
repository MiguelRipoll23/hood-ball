import { injectable, inject } from "@needle-di/core";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import { SceneManagerService } from "../../../engine/services/gameplay/scene-manager-service.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EventType } from "../../../engine/enums/event-type.js";
import { MainScene } from "../../scenes/main/main-scene.js";
import { MainMenuScene } from "../../scenes/main/main-menu/main-menu-scene.js";
import type { ServerDisconnectedPayload } from "../../interfaces/events/server-disconnected-payload-interface.js";
import type { ServerNotificationPayload } from "../../interfaces/events/server-notification-payload-interface.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { GamePlayer } from "../../models/game-player.js";

@injectable()
export class GameLifecycleService {
  constructor(
    private eventConsumerService: EventConsumerService = inject(
      EventConsumerService
    ),
    private sceneTransitionService: SceneTransitionService = inject(
      SceneTransitionService
    ),
    private gameState: GameState = inject(GameState),
    private matchSessionService: MatchSessionService = inject(
      MatchSessionService
    ),
    private gamePlayer: GamePlayer = inject(GamePlayer),
    private sceneManagerService: SceneManagerService = inject(
      SceneManagerService
    )
  ) {}

  public start(): void {
    this.subscribeToLocalEvents();
  }

  private subscribeToLocalEvents(): void {
    this.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerDisconnected,
      this.handleServerDisconnectedEvent.bind(this),
      true
    );

    this.eventConsumerService.subscribeToLocalEvent(
      EventType.HostDisconnected,
      this.handleHostDisconnectedEvent.bind(this),
      true
    );

    this.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerNotification,
      this.handleServerNotificationEvent.bind(this),
      true
    );
  }

  private handleServerDisconnectedEvent(
    payload: ServerDisconnectedPayload
  ): void {
    const currentScene = this.gameState.getGameFrame().getCurrentScene();

    if (currentScene instanceof MainScene) {
      const subScene = currentScene.getSceneManagerService()?.getCurrentScene();

      if (subScene instanceof MainMenuScene) {
        this.matchSessionService.setMatch(null);
        this.gamePlayer.reset();
        subScene.startServerReconnection();
        if (payload.connectionLost) {
          subScene.setPendingMessage("Connection to server was lost");
        }
        return;
      }
    }

    const message = payload.connectionLost
      ? "Connection to server was lost"
      : undefined;
    this.returnToMainMenuScene(true, message);
  }

  private handleServerNotificationEvent(
    payload: ServerNotificationPayload
  ): void {
    this.gameState
      .getGameFrame()
      .getNotificationEntity()
      ?.show(payload.message);
  }

  private handleHostDisconnectedEvent(): void {
    const message = "Host has disconnected";
    this.returnToMainMenuScene(false, message);
  }

  private returnToMainMenuScene(reconnect: boolean, message?: string): void {
    this.matchSessionService.setMatch(null);
    this.gamePlayer.reset();

    const mainScene = new MainScene(
      this.gameState,
      this.eventConsumerService,
      this.sceneManagerService
    );
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      this.eventConsumerService,
      false
    );

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    if (message) {
      mainMenuScene.setPendingMessage(message);
    }

    this.sceneTransitionService.fadeOutAndIn(
      this.gameState.getGameFrame(),
      mainScene,
      1,
      1
    );

    if (reconnect) {
      mainMenuScene.startServerReconnection();
    }
  }
}
