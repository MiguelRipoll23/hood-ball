import { inject, injectable } from "@needle-di/core";
import { EngineLoopService } from "@engine/loop/engine-loop-service.js";
import { ENGINE_CONTEXT_TOKEN } from "@engine/state/engine-context.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../core/constants/canvas-constants.js";
import { DebugUtils } from "@engine/utils/debug-utils.js";
import { NotificationEntity } from "../../core/entities/notification-entity.js";
import { DebugEntity } from "../../core/entities/debug-entity.js";
import { LoadingIndicatorEntity } from "../../core/entities/loading-indicator-entity.js";
import type { GameScene } from "../../core/interfaces/scenes/game-scene.js";
import type { GameLoopServiceContract } from "@engine/contracts/gameplay/game-loop-service-interface.js";
import type { EventSubscription } from "../types/event-subscription.js";
import { EventType } from "../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../interfaces/events/server-notification-payload.js";
import { GameState } from "../state/game-state.js";
import type { EngineContext } from "@engine/state/engine-context.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import { SceneTransitionService } from "@engine/services/scene/scene-transition-service.js";
import { TimerManagerService } from "@engine/services/time/timer-manager-service.js";
import { IntervalManagerService } from "@engine/services/time/interval-manager-service.js";
import { MatchmakingService } from "../services/gameplay/matchmaking-service.js";
import { DebugService } from "../services/debug/debug-service.js";
import { WebRTCService } from "../services/network/webrtc-service.js";
import type { GameSceneProviderContract } from "../interfaces/services/ui/game-scene-provider-interface.js";
import { GameSceneProvider } from "../services/ui/game-scene-provider.js";
import { MainScene } from "../scenes/main/main-scene.js";
import { MainMenuScene } from "../scenes/main/main-menu/main-menu-scene.js";
import { GAME_VERSION } from "../constants/game-constants.js";

export type GameLoopFacadeInitializationOptions = {
  canvas: HTMLCanvasElement;
  debugging: boolean;
};

@injectable()
export class GameLoopFacade implements GameLoopServiceContract {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private gameFrame: ReturnType<GameState["getGameFrame"]>;
  private initialized = false;
  private debugLoggingEnabled = false;

  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;
  private readonly localEventSubscriptions: EventSubscription[] = [];

  constructor(
    private readonly engineLoopService = inject(EngineLoopService),
    private readonly gameState = inject(GameState),
    private readonly engineContext: EngineContext = inject(ENGINE_CONTEXT_TOKEN) as EngineContext,
    private readonly eventConsumerService = inject(EventConsumerService),
    private readonly sceneTransitionService = inject(SceneTransitionService),
    private readonly timerManagerService = inject(TimerManagerService),
    private readonly intervalManagerService = inject(IntervalManagerService),
    private readonly sceneProvider: GameSceneProviderContract = inject(GameSceneProvider),
    private readonly matchmakingService = inject(MatchmakingService),
    private readonly webrtcService = inject(WebRTCService),
    private readonly debugService = inject(DebugService)
  ) {
    this.gameFrame = this.engineContext.getGameFrame();
  }

  public initialize(options: GameLoopFacadeInitializationOptions): void {
    if (this.initialized) {
      throw new Error("GameLoopFacade has already been initialized");
    }

    this.canvas = options.canvas;
    this.context = this.obtainContext(options.canvas);
    this.debugLoggingEnabled = options.debugging;
    this.gameFrame = this.engineContext.getGameFrame();

    this.logDebugInfo();
    this.loadEntities();
    this.subscribeToEvents();

    this.engineLoopService.configure({
      canvas: this.canvas,
      context: this.context,
      onResize: this.handleResize,
      callbacks: {
        onBeforeStart: this.setInitialScene,
        beforeUpdate: this.consumeEvents,
        update: this.update,
        render: this.render,
        onSecondElapsed: () => this.webrtcService.resetNetworkStats(),
      },
    });

    this.initialized = true;
  }

  public start(): void {
    if (!this.initialized) {
      throw new Error("GameLoopFacade must be initialized before calling start()");
    }

    this.engineLoopService.start();
  }

  public stop(): void {
    this.engineLoopService.stop();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.requireCanvas();
  }

  private readonly consumeEvents = (_deltaTime: DOMHighResTimeStamp): void => {
    this.eventConsumerService.consumeEvents();
  };

  private readonly update = (deltaTime: DOMHighResTimeStamp): void => {
    this.timerManagerService.update(deltaTime);
    this.intervalManagerService.update(deltaTime);
    this.sceneTransitionService.update(deltaTime);

    const gameFrame = this.gameFrame;

    gameFrame.getCurrentScene()?.update(deltaTime);
    gameFrame.getNextScene()?.update(deltaTime);
    gameFrame.getNotificationEntity()?.update(deltaTime);
    gameFrame.getLoadingIndicatorEntity()?.update(deltaTime);

    if (this.gameState.isDebugging()) {
      gameFrame.getDebugEntity()?.update(deltaTime);
    }
  };

  private readonly render = (context: CanvasRenderingContext2D): void => {
    const canvas = this.requireCanvas();
    const gameFrame = this.gameFrame;

    context.clearRect(0, 0, canvas.width, canvas.height);

    gameFrame.getCurrentScene()?.render(context);
    gameFrame.getNextScene()?.render(context);

    gameFrame.getNotificationEntity()?.render(context);
    gameFrame.getLoadingIndicatorEntity()?.render(context);

    if (this.gameState.isDebugging()) {
      this.renderDebugInformation(context);
    }

    this.debugService.render();
  };

  private readonly handleResize = (): void => {
    const canvas = this.requireCanvas();

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const viewportWidth = document.body.clientWidth;
    const viewportHeight = document.body.clientHeight;
    const canvasAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    let newWidth = viewportWidth;
    let newHeight = viewportHeight;

    if (viewportWidth / viewportHeight > canvasAspectRatio) {
      newWidth = viewportHeight * canvasAspectRatio;
    } else {
      newHeight = viewportWidth / canvasAspectRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  };

  private readonly setInitialScene = (): void => {
    const mainScene = this.sceneProvider.createRootScene(
      this.gameState,
      this.eventConsumerService
    ) as MainScene;
    const loginScene = this.sceneProvider.createLoginScene(
      this.gameState,
      this.eventConsumerService
    );

    mainScene.activateScene(loginScene);
    mainScene.load();

    this.sceneTransitionService.crossfade(this.gameFrame, mainScene, 1);
  };

  private loadEntities(): void {
    this.loadNotificationEntity();
    this.loadDebugEntity();
    this.loadLoadingIndicatorEntity();
  }

  private loadNotificationEntity(): void {
    const notificationEntity = new NotificationEntity(this.requireCanvas());
    this.gameFrame.setNotificationEntity(notificationEntity);
  }

  private loadDebugEntity(): void {
    const debugEntity = new DebugEntity(this.requireCanvas());
    this.gameFrame.setDebugEntity(debugEntity);
  }

  private loadLoadingIndicatorEntity(): void {
    this.loadingIndicatorEntity = new LoadingIndicatorEntity(this.requireCanvas());
    this.gameFrame.setLoadingIndicatorEntity(this.loadingIndicatorEntity);
  }

  private subscribeToEvents(): void {
    const serverDisconnected = this.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerDisconnected,
      this.handleServerDisconnectedEvent,
      true
    );

    const hostDisconnected = this.eventConsumerService.subscribeToLocalEvent(
      EventType.HostDisconnected,
      this.handleHostDisconnectedEvent,
      true
    );

    const serverNotification = this.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerNotification,
      this.handleServerNotificationEvent,
      true
    );

    this.localEventSubscriptions.push(
      serverDisconnected,
      hostDisconnected,
      serverNotification
    );
  }

  private readonly handleServerDisconnectedEvent = (
    payload: ServerDisconnectedPayload
  ): void => {
    const currentScene = this.gameFrame.getCurrentScene();

    if (currentScene instanceof MainScene) {
      const subScene = currentScene.getSceneManagerService()?.getCurrentScene();

      if (subScene instanceof MainMenuScene) {
        this.gameState.setMatch(null);
        this.gameState.getGamePlayer().reset();
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
  };

  private readonly handleServerNotificationEvent = (
    payload: ServerNotificationPayload
  ): void => {
    this.gameFrame.getNotificationEntity()?.show(payload.message);
  };

  private readonly handleHostDisconnectedEvent = (): void => {
    this.returnToMainMenuScene(false, "Host has disconnected");
  };

  private returnToMainMenuScene(reconnect: boolean, message?: string): void {
    this.gameState.setMatch(null);
    this.gameState.getGamePlayer().reset();

    const mainScene = this.sceneProvider.createRootScene(
      this.gameState,
      this.eventConsumerService
    ) as MainScene;
    const mainMenuScene = this.sceneProvider.createMainMenuScene(
      this.gameState,
      this.eventConsumerService,
      reconnect
    ) as MainMenuScene;

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    if (message) {
      mainMenuScene.setPendingMessage(message);
    }

    this.sceneTransitionService.fadeOutAndIn(this.gameFrame, mainScene, 1, 1);

    if (reconnect) {
      mainMenuScene.startServerReconnection();
    }
  }

  private renderDebugInformation(context: CanvasRenderingContext2D): void {
    const canvas = this.requireCanvas();

    context.save();

    this.matchmakingService.renderDebugInformation(context);
    this.webrtcService.renderDebugInformation(context);
    this.gameFrame.getDebugEntity()?.render(context);

    this.renderDebugGameInformation(context, canvas);
    this.renderDebugSceneInformation(context, canvas);

    this.gameState.getGamePointer().renderDebugInformation(context);
    context.restore();
  }

  private renderDebugGameInformation(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    DebugUtils.renderText(
      context,
      canvas.width - 24,
      canvas.height - 24,
      `v${GAME_VERSION}`,
      true,
      true
    );
  }

  private renderDebugSceneInformation(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ): void {
    DebugUtils.renderText(
      context,
      canvas.width - 24,
      24,
      `FPS: ${this.engineLoopService.getCurrentFPS().toFixed(1)}`,
      true
    );

    const currentScene = this.gameFrame.getCurrentScene();
    const currentSceneName = currentScene?.constructor.name ?? "No scene";

    DebugUtils.renderText(
      context,
      canvas.width - 24,
      48,
      currentSceneName,
      true
    );

    this.renderDebugSubSceneInformation(context, canvas, currentScene);
  }

  private renderDebugSubSceneInformation(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    currentScene: GameScene | null
  ): void {
    const sceneManagerService = currentScene?.getSceneManagerService();
    const currentSubScene = sceneManagerService?.getCurrentScene() ?? null;
    const currentSubSceneName = currentSubScene?.constructor.name ?? null;

    if (currentSubSceneName === null) {
      return;
    }

    DebugUtils.renderText(
      context,
      canvas.width - 24,
      72,
      currentSubSceneName,
      true
    );
  }

  private logDebugInfo(): void {
    if (!this.debugLoggingEnabled) {
      return;
    }

    console.info(
      "%cDebug mode on",
      "color: #b6ff35; font-size: 20px; font-weight: bold"
    );
  }

  private obtainContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Unable to acquire 2D rendering context");
    }

    return context;
  }

  private requireCanvas(): HTMLCanvasElement {
    if (this.canvas === null) {
      throw new Error("GameLoopFacade has not been initialized");
    }

    return this.canvas;
  }
}




