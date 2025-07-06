import { GameFrame } from "../../models/game-frame.js";
import { NotificationEntity } from "../../entities/notification-entity.js";
import { MainScene } from "../../../game/scenes/main/main-scene.js";
import { LoginScene } from "../../../game/scenes/main/login/login-scene.js";
import { MainMenuScene } from "../../../game/scenes/main/main-menu/main-menu-scene.js";
import { EventType } from "../../../game/enums/event-type.js";
import type { ServerDisconnectedPayload } from "../../../game/interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../../../game/interfaces/events/server-notification-payload.js";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from "../../constants/canvas-constants.js";
import { DebugUtils } from "../../utils/debug-utils.js";
import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import { GAME_VERSION } from "../../../game/constants/game-constants.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { DebugEntity } from "../../entities/debug-entity.js";
import { GameState } from "../../models/game-state.js";
import { MatchStateType } from "../../../game/enums/match-state-type.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import { MatchmakingService } from "../../../game/services/gameplay/matchmaking-service.js";
import { DebugService } from "../../../game/services/debug/debug-service.js";
import { WebRTCService } from "../../../game/services/network/webrtc-service.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { ServiceRegistry } from "../service-registry.js";
import { LoadingIndicatorEntity } from "../../entities/loading-indicator-entity.js";
import { container } from "../di-container.js";

export class GameLoopService {
  private context: CanvasRenderingContext2D;
  private debug: boolean = window.location.search.includes("debug");

  private gameState: GameState;
  private gameFrame: GameFrame;

  private isRunning: boolean = false;
  private previousTimeStamp: DOMHighResTimeStamp | null = null;
  private deltaTimeStamp: DOMHighResTimeStamp = 0;
  private elapsedMilliseconds: number = 0;

  // Game stats
  private currentFPS: number = 0;

  // Services
  private debugService: DebugService;
  private sceneTransitionService: SceneTransitionService;
  private timerManagerService: TimerManagerService;
  private intervalManagerService: IntervalManagerService;
  private eventConsumerService: EventConsumerService;
  private matchmakingService: MatchmakingService;
  private webrtcService: WebRTCService;
  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.logDebugInfo();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    ServiceRegistry.register(this.canvas, this.debug);
    this.gameState = container.get(GameState);
    this.gameFrame = this.gameState.getGameFrame();
    this.debugService = container.get(DebugService);
    this.sceneTransitionService = container.get(SceneTransitionService);
    this.timerManagerService = container.get(TimerManagerService);
    this.intervalManagerService = container.get(IntervalManagerService);
    this.eventConsumerService = container.get(EventConsumerService);
    this.matchmakingService = container.get(MatchmakingService);
    this.webrtcService = container.get(WebRTCService);
    this.addWindowAndGameListeners();
    this.setCanvasSize();
    this.loadEntities();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public start(): void {
    this.isRunning = true;
    requestAnimationFrame(this.loop.bind(this));
    this.setInitialScene();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private logDebugInfo(): void {
    if (this.debug === false) return;

    console.info(
      "%cDebug mode on",
      "color: #b6ff35; font-size: 20px; font-weight: bold"
    );
  }

  private setCanvasSize(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

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

    this.canvas.style.width = newWidth + "px";
    this.canvas.style.height = newHeight + "px";
  }

  private addWindowAndGameListeners(): void {
    this.listenForWindowEvents();
    this.subscribeToEvents();
  }

  private listenForWindowEvents(): void {
    window.addEventListener("resize", this.setCanvasSize.bind(this));
  }

  private subscribeToEvents(): void {
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
    const match = this.gameState.getMatch();
    const state = match?.getState();

    if (state !== undefined && state !== MatchStateType.WaitingPlayers) {
      console.warn("WebSocket disconnected during active match");
      // Wait to reconnect when returning to the main menu
      return;
    }

    if (payload.connectionLost) {
      alert("Connection to server was lost");
    } else {
      alert("Failed to connect to server");
    }

    window.location.reload();
  }

  private handleServerNotificationEvent(
    payload: ServerNotificationPayload
  ): void {
    this.gameFrame.getNotificationEntity()?.show(payload.message);
  }

  private handleHostDisconnectedEvent(): void {
    alert("Host has disconnected");

    const mainScene = new MainScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      false
    );

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    this.sceneTransitionService.fadeOutAndIn(this.gameFrame, mainScene, 1, 1);
  }

  private loadEntities(): void {
    this.loadNotificationEntity();
    this.loadDebugEntity();
    this.loadLoadingIndicatorEntity();
  }

  private loadNotificationEntity(): void {
    const notificationEntity = new NotificationEntity(this.canvas);
    this.gameFrame.setNotificationEntity(notificationEntity);
  }

  private loadDebugEntity(): void {
    const debugEntity = new DebugEntity(this.canvas);
    this.gameFrame.setDebugEntity(debugEntity);
  }

  private loadLoadingIndicatorEntity(): void {
    this.loadingIndicatorEntity = new LoadingIndicatorEntity(this.canvas);
    this.gameFrame.setLoadingIndicatorEntity(this.loadingIndicatorEntity);
  }

  private setInitialScene() {
    const mainScene = new MainScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    const loginScene = new LoginScene(
      this.gameState,
      container.get(EventConsumerService)
    );

    mainScene.activateScene(loginScene);
    mainScene.load();

    this.sceneTransitionService.crossfade(this.gameFrame, mainScene, 1);
  }

  private loop(timeStamp: DOMHighResTimeStamp): void {
    if (this.previousTimeStamp === null) {
      this.deltaTimeStamp = 0;
      this.currentFPS = 0;
    } else {
      this.deltaTimeStamp = Math.min(timeStamp - this.previousTimeStamp, 100);
      this.currentFPS = 1000 / this.deltaTimeStamp;
    }

    this.previousTimeStamp = timeStamp;
    this.elapsedMilliseconds += this.deltaTimeStamp;

    if (this.elapsedMilliseconds >= 1_000) {
      this.elapsedMilliseconds = 0;
      this.webrtcService.resetNetworkStats();
    }

    this.update(this.deltaTimeStamp);
    this.render();

    if (this.isRunning) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  private update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.eventConsumerService.consumeEvents();

    this.timerManagerService.update(deltaTimeStamp);
    this.intervalManagerService.update(deltaTimeStamp);
    this.sceneTransitionService.update(deltaTimeStamp);

    this.gameFrame.getCurrentScene()?.update(deltaTimeStamp);
    this.gameFrame.getNextScene()?.update(deltaTimeStamp);
    this.gameFrame.getNotificationEntity()?.update(deltaTimeStamp);
    this.gameFrame.getLoadingIndicatorEntity()?.update(deltaTimeStamp);

    if (this.gameState.isDebugging()) {
      this.gameFrame.getDebugEntity()?.update(deltaTimeStamp);
    }
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameFrame.getCurrentScene()?.render(this.context);
    this.gameFrame.getNextScene()?.render(this.context);

    this.gameFrame.getNotificationEntity()?.render(this.context);
    this.gameFrame.getLoadingIndicatorEntity()?.render(this.context);

    if (this.gameState.isDebugging()) {
      this.renderDebugInformation();
    }

    // Dear ImGui rendering
    this.debugService.render();
  }

  private renderDebugInformation(): void {
    this.context.save();

    this.matchmakingService.renderDebugInformation(this.context);

    this.webrtcService.renderDebugInformation(this.context);
    this.gameFrame.getDebugEntity()?.render(this.context);

    this.renderDebugGameInformation();
    this.renderDebugSceneInformation();

    this.gameState.getGamePointer().renderDebugInformation(this.context);
    this.context.restore();
  }

  private renderDebugGameInformation(): void {
    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      this.canvas.height - 24,
      `v${GAME_VERSION}`,
      true,
      true
    );
  }

  private renderDebugSceneInformation(): void {
    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      24,
      `FPS: ${this.currentFPS.toFixed(1)}`,
      true
    );

    const currentScene = this.gameFrame.getCurrentScene();
    const currentSceneName = currentScene?.constructor.name ?? "No scene";

    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      48,
      currentSceneName,
      true
    );

    this.renderDebugSubSceneInformation(currentScene);
  }

  private renderDebugSubSceneInformation(currentScene: GameScene | null): void {
    const sceneManagerService = currentScene?.getSceneManagerService();
    const currentSubScene = sceneManagerService?.getCurrentScene() ?? null;
    const currentSubSceneName = currentSubScene?.constructor.name ?? null;

    if (currentSubSceneName === null) {
      return;
    }

    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      72,
      currentSubSceneName,
      true
    );
  }
}
