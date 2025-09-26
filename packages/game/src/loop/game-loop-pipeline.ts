import { injectable } from "@needle-di/core";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@game/constants/canvas-constants.js";
import { DebugUtils } from "@engine/utils/debug-utils.js";
import { NotificationEntity } from "@engine/entities/notification-entity.js";
import { DebugEntity } from "@engine/entities/debug-entity.js";
import { LoadingIndicatorEntity } from "@engine/entities/loading-indicator-entity.js";
import type { GameScene } from "@engine/interfaces/scenes/game-scene.js";
import type { EngineContext } from "@engine/state/engine-context.js";
import type { EventSubscription } from "@game/types/event-subscription.js";
import { EventType } from "@game/enums/event-type.js";
import type { ServerDisconnectedPayload } from "@game/interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "@game/interfaces/events/server-notification-payload.js";
import { GAME_VERSION } from "@game/constants/game-constants.js";
import type { GameSceneProviderContract } from "@game/interfaces/services/ui/game-scene-provider-interface.js";
import type { GameState } from "@game/state/game-state.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import { SceneTransitionService } from "@engine/services/scene/scene-transition-service.js";
import { TimerManagerService } from "@engine/services/time/timer-manager-service.js";
import { IntervalManagerService } from "@engine/services/time/interval-manager-service.js";
import { MatchmakingService } from "@game/services/gameplay/matchmaking-service.js";
import { WebRTCService } from "@game/services/network/webrtc-service.js";
import { DebugService } from "@game/services/debug/debug-service.js";
import type { EngineLoopCallbacks } from "@engine/loop/engine-loop-service.js";
import type { GameLoopFacadeInitializationOptions } from "./game-loop-facade.js";
import type { MatchmakingCoordinator } from "@game/services/gameplay/matchmaking-coordinator.js";
import type { EventNetworkBridge } from "@game/services/network/event-network-bridge.js";
import type { RootGameScene } from "@game/interfaces/scenes/root-game-scene.js";
import type { MainMenuSceneContract } from "@game/interfaces/scenes/main-menu-scene-contract.js";

export type GameLoopPipelineSetupResult = {
  callbacks: EngineLoopCallbacks;
  onResize: () => void;
};

export type GameLoopPipelineDependencies = {
  engineContext: EngineContext;
  eventConsumerService: EventConsumerService;
  sceneTransitionService: SceneTransitionService;
  timerManagerService: TimerManagerService;
  intervalManagerService: IntervalManagerService;
  sceneProvider: GameSceneProviderContract;
  matchmakingService: MatchmakingService;
  matchmakingCoordinator: MatchmakingCoordinator;
  webrtcService: WebRTCService;
  eventNetworkBridge: EventNetworkBridge;
  debugService: DebugService;
};

@injectable()
export class GameLoopPipeline {
  private canvas: HTMLCanvasElement | null = null;
  private debugLoggingEnabled = false;
  private loopFpsProvider: () => number = () => 0;

  private readonly eventSubscriptions: EventSubscription[] = [];
  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;
  private gameFrame: ReturnType<GameState["getGameFrame"]>;

  constructor(private readonly gameState: GameState, private readonly deps: GameLoopPipelineDependencies) {
    this.gameFrame = deps.engineContext.getGameFrame();
  }

  public setup(
    options: GameLoopFacadeInitializationOptions & {
      context: CanvasRenderingContext2D;
      getCurrentFPS: () => number;
    }
  ): GameLoopPipelineSetupResult {
    this.canvas = options.canvas;
    this.debugLoggingEnabled = options.debugging;
    this.loopFpsProvider = options.getCurrentFPS;
    this.gameFrame = this.deps.engineContext.getGameFrame();

    this.deps.eventNetworkBridge.initialize();
    this.deps.matchmakingCoordinator.initialize();

    this.logDebugInfo();
    this.loadEntities();
    this.registerEventSubscriptions();

    const callbacks: EngineLoopCallbacks = {
      onBeforeStart: this.configureInitialScene,
      beforeUpdate: this.consumeEvents,
      update: this.update,
      render: this.render,
      afterRender: this.afterRender,
      onSecondElapsed: () => this.deps.webrtcService.resetNetworkStats(),
    };

    return {
      callbacks,
      onResize: this.handleResize,
    };
  }

  public destroy(): void {
    this.eventSubscriptions.forEach((subscription) =>
      this.deps.eventConsumerService.unsubscribeFromLocalEvent(subscription)
    );
    this.eventSubscriptions.length = 0;
    this.loadingIndicatorEntity = null;
    this.deps.eventNetworkBridge.dispose();
  }

  private readonly consumeEvents = (_deltaTime: DOMHighResTimeStamp): void => {
    this.deps.eventConsumerService.consumeEvents();
  };

  private readonly update = (deltaTime: DOMHighResTimeStamp): void => {
    this.deps.timerManagerService.update(deltaTime);
    this.deps.intervalManagerService.update(deltaTime);
    this.deps.sceneTransitionService.update(deltaTime);

    const frame = this.gameFrame;
    frame.getCurrentScene()?.update(deltaTime);
    frame.getNextScene()?.update(deltaTime);
    frame.getNotificationEntity()?.update(deltaTime);
    frame.getLoadingIndicatorEntity()?.update(deltaTime);

    if (this.gameState.isDebugging()) {
      frame.getDebugEntity()?.update(deltaTime);
    }
  };

  private readonly render = (context: CanvasRenderingContext2D): void => {
    const canvas = this.requireCanvas();
    const frame = this.gameFrame;

    context.clearRect(0, 0, canvas.width, canvas.height);

    frame.getCurrentScene()?.render(context);
    frame.getNextScene()?.render(context);
    frame.getNotificationEntity()?.render(context);
    frame.getLoadingIndicatorEntity()?.render(context);

    if (this.gameState.isDebugging()) {
      this.renderDebugOverlay(context);
    }
  };

  private readonly afterRender = (_context: CanvasRenderingContext2D): void => {
    this.deps.debugService.render();
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

  private readonly configureInitialScene = (): void => {
    const mainScene = this.deps.sceneProvider.createRootScene(
      this.gameState,
      this.deps.eventConsumerService
    );
    const loginScene = this.deps.sceneProvider.createLoginScene(
      this.gameState,
      this.deps.eventConsumerService
    );

    mainScene.activateScene(loginScene);
    mainScene.load();

    this.deps.sceneTransitionService.crossfade(this.gameFrame, mainScene, 1);
  };

  private registerEventSubscriptions(): void {
    const serverDisconnected = this.deps.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerDisconnected,
      this.handleServerDisconnectedEvent,
      true
    );

    const hostDisconnected = this.deps.eventConsumerService.subscribeToLocalEvent(
      EventType.HostDisconnected,
      this.handleHostDisconnectedEvent,
      true
    );

    const serverNotification = this.deps.eventConsumerService.subscribeToLocalEvent(
      EventType.ServerNotification,
      this.handleServerNotificationEvent,
      true
    );

    this.eventSubscriptions.push(serverDisconnected, hostDisconnected, serverNotification);
  }

  private readonly handleServerDisconnectedEvent = (
    payload: ServerDisconnectedPayload
  ): void => {
    const currentScene = this.gameFrame.getCurrentScene();

    if (this.isRootScene(currentScene)) {
      const subScene = currentScene
        .getSceneManagerService()
        ?.getCurrentScene() ?? null;

      if (this.isMainMenuScene(subScene)) {
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

    const mainScene = this.deps.sceneProvider.createRootScene(
      this.gameState,
      this.deps.eventConsumerService
    );
    const mainMenuScene = this.deps.sceneProvider.createMainMenuScene(
      this.gameState,
      this.deps.eventConsumerService,
      reconnect
    );

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    if (message) {
      mainMenuScene.setPendingMessage(message);
    }

    this.deps.sceneTransitionService.fadeOutAndIn(this.gameFrame, mainScene, 1, 1);

    if (reconnect) {
      mainMenuScene.startServerReconnection();
    }
  }

  private renderDebugOverlay(context: CanvasRenderingContext2D): void {
    const canvas = this.requireCanvas();

    context.save();

    this.deps.matchmakingService.renderDebugInformation(context);
    this.deps.webrtcService.renderDebugInformation(context);
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
      `FPS: ${this.loopFpsProvider().toFixed(1)}`,
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

  private logDebugInfo(): void {
    if (!this.debugLoggingEnabled) {
      return;
    }

    console.info(
      "%cDebug mode on",
      "color: #b6ff35; font-size: 20px; font-weight: bold"
    );
  }

  private requireCanvas(): HTMLCanvasElement {
    if (this.canvas === null) {
      throw new Error("GameLoopPipeline has not been initialised");
    }

    return this.canvas;
  }

  private isRootScene(scene: GameScene | null): scene is RootGameScene {
    return (
      scene !== null &&
      typeof (scene as RootGameScene).activateScene === "function" &&
      typeof (scene as RootGameScene).getSceneManagerService === "function"
    );
  }

  private isMainMenuScene(
    scene: GameScene | null
  ): scene is MainMenuSceneContract {
    return (
      scene !== null &&
      typeof (scene as MainMenuSceneContract).startServerReconnection ===
        "function" &&
      typeof (scene as MainMenuSceneContract).setPendingMessage === "function"
    );
  }
}
