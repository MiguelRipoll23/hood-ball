import { GameFrame } from "../models/game-frame.js";
import { NotificationObject } from "../objects/common/notification-object.js";
import { MainScreen } from "../screens/main-screen.js";
import { LoginScreen } from "../screens/main-screen/login-screen.js";
import { MainMenuScreen } from "../screens/main-screen/main-menu-screen.js";
import { EventType } from "../enums/event-type.js";
import type { ServerDisconnectedPayload } from "../interfaces/events/server-disconnected-payload.js";
import type { ServerNotificationPayload } from "../interfaces/events/server-notification-payload.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/canvas-constants.js";
import { DebugUtils } from "../utils/debug-utils.js";
import type { GameScreen } from "../interfaces/screena/game-screen.js";
import { GAME_VERSION } from "../constants/game-constants.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { DebugObject } from "../objects/common/debug-object.js";
import { GameState } from "../models/game-state.js";
import { ServiceLocator } from "./service-locator.js";
import { ScreenTransitionService } from "./screen-transition-service.js";
import { MatchmakingService } from "./matchmaking-service.js";
import { DebugService } from "./debug-service.js";
import { WebRTCService } from "./webrtc-service.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { ServiceManager } from "./service-manager.js";

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
  private screenTransitionService: ScreenTransitionService;
  private timerManagerService: TimerManagerService;
  private intervalManagerService: IntervalManagerService;
  private eventConsumerService: EventConsumerService;
  private matchmakingService: MatchmakingService;
  private webrtcService: WebRTCService;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.logDebugInfo();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    ServiceManager.register(this.canvas, this.debug);
    this.gameState = ServiceLocator.get(GameState);
    this.gameFrame = this.gameState.getGameFrame();
    this.debugService = ServiceLocator.get(DebugService);
    this.screenTransitionService = ServiceLocator.get(ScreenTransitionService);
    this.timerManagerService = ServiceLocator.get(TimerManagerService);
    this.intervalManagerService = ServiceLocator.get(IntervalManagerService);
    this.eventConsumerService = ServiceLocator.get(EventConsumerService);
    this.matchmakingService = ServiceLocator.get(MatchmakingService);
    this.webrtcService = ServiceLocator.get(WebRTCService);
    this.addWindowAndGameListeners();
    this.setCanvasSize();
    this.loadObjects();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public start(): void {
    this.isRunning = true;
    requestAnimationFrame(this.loop.bind(this));
    this.setInitialScreen();
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
    this.gameFrame.getNotificationObject()?.show(payload.message);
  }

  private handleHostDisconnectedEvent(): void {
    alert("Host has disconnected");

    const mainScreen = new MainScreen(this.gameState);
    const mainMenuScreen = new MainMenuScreen(this.gameState, false);

    mainScreen.setScreen(mainMenuScreen);
    mainScreen.load();

    this.screenTransitionService.fadeOutAndIn(mainScreen, 1, 1);
  }

  private loadObjects(): void {
    this.loadNotificationObject();
    this.loadDebugObject();
  }

  private loadNotificationObject(): void {
    const notificationObject = new NotificationObject(this.canvas);
    this.gameFrame.setNotificationObject(notificationObject);
  }

  private loadDebugObject(): void {
    const debugObject = new DebugObject(this.canvas);
    this.gameFrame.setDebugObject(debugObject);
  }

  private setInitialScreen() {
    const mainScreen = new MainScreen(this.gameState);
    const loginScreen = new LoginScreen(this.gameState);

    mainScreen.setScreen(loginScreen);
    mainScreen.load();

    this.screenTransitionService.crossfade(mainScreen, 1);
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
    this.screenTransitionService.update(deltaTimeStamp);

    this.gameFrame.getCurrentScreen()?.update(deltaTimeStamp);
    this.gameFrame.getNextScreen()?.update(deltaTimeStamp);
    this.gameFrame.getNotificationObject()?.update(deltaTimeStamp);

    if (this.gameState.isDebugging()) {
      this.gameFrame.getDebugObject()?.update(deltaTimeStamp);
    }
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameFrame.getCurrentScreen()?.render(this.context);
    this.gameFrame.getNextScreen()?.render(this.context);
    this.gameFrame.getNotificationObject()?.render(this.context);

    if (this.gameState.isDebugging()) {
      this.renderDebugInformation();
    }
  }

  private renderDebugInformation(): void {
    this.context.save();

    this.matchmakingService.renderDebugInformation(this.context);

    this.webrtcService.renderDebugInformation(this.context);
    this.gameFrame.getDebugObject()?.render(this.context);

    this.renderDebugGameInformation();
    this.renderDebugScreenInformation();

    this.gameState.getGamePointer().renderDebugInformation(this.context);
    this.context.restore();

    // Dear ImGui rendering
    this.debugService.render();
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

  private renderDebugScreenInformation(): void {
    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      24,
      `FPS: ${this.currentFPS.toFixed(1)}`,
      true
    );

    const currentScreen = this.gameFrame.getCurrentScreen();
    const currentScreenName = currentScreen?.constructor.name ?? "No screen";

    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      48,
      currentScreenName,
      true
    );

    this.renderDebugSubScreenInformation(currentScreen);
  }

  private renderDebugSubScreenInformation(
    currentScreen: GameScreen | null
  ): void {
    const screenManagerService = currentScreen?.getScreenManagerService();
    const currentSubScreen = screenManagerService?.getCurrentScreen() ?? null;
    const currentSubScreenName = currentSubScreen?.constructor.name ?? null;

    if (currentSubScreenName === null) {
      return;
    }

    DebugUtils.renderText(
      this.context,
      this.canvas.width - 24,
      72,
      currentSubScreenName,
      true
    );
  }
}
