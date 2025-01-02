import { GameController } from "../models/game-controller.js";
import { GameFrame } from "../models/game-frame.js";
import { NotificationObject } from "../objects/common/notification-object.js";
import { MainScreen } from "../screens/main-screen.js";
import { LoginScreen } from "../screens/main-screen/login-screen.js";
import { MainMenuScreen } from "../screens/main-screen/main-menu-screen.js";
import { EventType } from "../enums/event-type.js";
import { ServerDisconnectedPayload } from "../interfaces/event/server-disconnected-payload.js";
import { ServerNotificationPayload } from "../interfaces/event/server-notification-payload.js";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/canvas-constants.js";
import { DebugUtils } from "../utils/debug-utils.js";

export class GameLoopService {
  private context: CanvasRenderingContext2D;
  private debug: boolean = false;

  private gameController: GameController;
  private gameFrame: GameFrame;

  private isRunning: boolean = false;
  private previousTimeStamp: DOMHighResTimeStamp | null = null;
  private deltaTimeStamp: DOMHighResTimeStamp = 0;
  private elapsedMilliseconds: number = 0;

  // Game stats
  private currentFPS: number = 0;

  // Network stats
  private downloadKilobytesPerSecond: number = 0;
  private uploadKilobytesPerSecond: number = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.logDebugInfo();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.gameController = new GameController(this.canvas, this.debug);
    this.gameFrame = this.gameController.getGameFrame();

    this.setCanvasSize();
    this.listenForWindowEvents();
    this.loadNotificationObject();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getGameController(): GameController {
    return this.gameController;
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

  private listenForWindowEvents(): void {
    window.addEventListener("resize", this.setCanvasSize.bind(this));
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

    const mainScreen = new MainScreen(this.getGameController());
    const mainMenuScreen = new MainMenuScreen(this.getGameController(), false);

    mainScreen.setScreen(mainMenuScreen);
    mainScreen.loadObjects();

    this.getGameController()
      .getTransitionService()
      .fadeOutAndIn(mainScreen, 1, 1);
  }

  private loadNotificationObject(): void {
    const notificationObject = new NotificationObject(this.canvas);

    this.gameFrame.setNotificationObject(notificationObject);
  }

  private setInitialScreen() {
    const mainScreen = new MainScreen(this.gameController);
    const loginScreen = new LoginScreen(this.gameController);

    mainScreen.setScreen(loginScreen);
    mainScreen.loadObjects();

    this.gameController.getTransitionService().crossfade(mainScreen, 1);
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
      this.updateNetworkStats();
    }

    this.update(this.deltaTimeStamp);
    this.render();

    if (this.isRunning) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  private updateNetworkStats(): void {
    this.downloadKilobytesPerSecond =
      this.gameController.getWebRTCService().getDownloadBytes() / 1024;

    this.uploadKilobytesPerSecond =
      this.gameController.getWebRTCService().getUploadBytes() / 1024;

    this.gameController.getWebRTCService().resetStats();
  }

  private update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.listenForEvents();

    this.gameController
      .getTimers()
      .forEach((timer) => timer.update(deltaTimeStamp));

    this.gameController
      .getIntervals()
      .forEach((interval) => interval.update(deltaTimeStamp));

    this.gameController.getTransitionService().update(deltaTimeStamp);

    this.gameFrame.getCurrentScreen()?.update(deltaTimeStamp);
    this.gameFrame.getNextScreen()?.update(deltaTimeStamp);
    this.gameFrame.getNotificationObject()?.update(deltaTimeStamp);

    this.gameController
      .getTimers()
      .filter((timer) => timer.hasCompleted())
      .forEach((timer) => this.gameController.removeTimer(timer));
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.gameFrame.getCurrentScreen()?.render(this.context);
    this.gameFrame.getNextScreen()?.render(this.context);
    this.gameFrame.getNotificationObject()?.render(this.context);

    if (this.gameController.isDebugging()) {
      this.renderDebugInformation();
    }
  }

  private listenForEvents(): void {
    this.gameController
      .getEventProcessorService()
      .listenLocalEvent(
        EventType.ServerDisconnected,
        this.handleServerDisconnectedEvent.bind(this)
      );

    this.gameController
      .getEventProcessorService()
      .listenLocalEvent(
        EventType.HostDisconnected,
        this.handleHostDisconnectedEvent.bind(this)
      );

    this.gameController
      .getEventProcessorService()
      .listenLocalEvent(
        EventType.ServerNotification,
        this.handleServerNotificationEvent.bind(this)
      );
  }

  private renderDebugInformation(): void {
    DebugUtils.renderDebugText(
      this.context,
      this.canvas.width - 24,
      24,
      `FPS: ${this.currentFPS.toFixed(1)}`,
      true
    );

    this.renderDebugNetworkInformation();
    this.renderDebugGamePointer();
  }

  private renderDebugNetworkInformation(): void {
    DebugUtils.renderDebugText(
      this.context,
      24,
      72,
      `Download: ${this.downloadKilobytesPerSecond.toFixed(1)} KB/s`
    );

    DebugUtils.renderDebugText(
      this.context,
      24,
      96,
      `Upload: ${this.uploadKilobytesPerSecond.toFixed(1)} KB/s`
    );
  }

  private renderDebugGamePointer(): void {
    const gamePointer = this.gameController.getGamePointer();

    if (gamePointer.isTouch() && gamePointer.isPressing() == false) {
      return;
    }

    this.context.fillStyle = "rgba(148, 0, 211, 0.5)";
    this.context.beginPath();
    this.context.arc(
      gamePointer.getX(),
      gamePointer.getY(),
      15,
      0,
      Math.PI * 2
    );
    this.context.closePath();
    this.context.fill();
  }
}
