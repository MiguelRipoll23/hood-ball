import { GameFrame } from "../../models/game-frame.js";
import { NotificationEntity } from "../../entities/notification-entity.js";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from "../../constants/canvas-constants.js";
import { GAME_VERSION } from "../../../game/constants/game-constants.js";
import { DebugUtils } from "../../utils/debug-utils.js";
import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { DebugEntity } from "../../entities/debug-entity.js";
import { GameState } from "../../models/game-state.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { IntervalManagerService } from "./interval-manager-service.js";
import { LoadingIndicatorEntity } from "../../entities/loading-indicator-entity.js";
import { RecorderService } from "./recorder-service.js";
import { injectable, inject } from "@needle-di/core";
import { DebugService } from "../debug/debug-service.js";

@injectable()
export class GameLoopService {
  private context: CanvasRenderingContext2D;
  private debug: boolean = window.location.search.includes("debug");

  private gameFrame: GameFrame;

  private isRunning: boolean = false;
  private previousTimeStamp: DOMHighResTimeStamp | null = null;
  private deltaTimeStamp: DOMHighResTimeStamp = 0;
  private elapsedMilliseconds: number = 0;

  // Game stats
  private currentFPS: number = 0;

  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement = inject(HTMLCanvasElement),
    private gameState: GameState = inject(GameState),
    private sceneTransitionService: SceneTransitionService = inject(
      SceneTransitionService
    ),
    private timerManagerService: TimerManagerService = inject(
      TimerManagerService
    ),
    private intervalManagerService: IntervalManagerService = inject(
      IntervalManagerService
    ),
    private eventConsumerService: EventConsumerService = inject(
      EventConsumerService
    ),
    private recorderService: RecorderService = inject(RecorderService),
    private debugService: DebugService = inject(DebugService)
  ) {
    this.logDebugInfo();
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.gameFrame = this.gameState.getGameFrame();
    this.addWindowAndGameListeners();
    this.setCanvasSize();
    this.loadEntities();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public async start(initialScene: GameScene): Promise<void> {
    await this.debugService.init();
    this.isRunning = true;
    requestAnimationFrame(this.loop.bind(this));
    this.setInitialScene(initialScene);
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
  }

  private listenForWindowEvents(): void {
    window.addEventListener("resize", this.setCanvasSize.bind(this));
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

  private setInitialScene(initialScene: GameScene) {
    initialScene.load();
    this.sceneTransitionService.crossfade(this.gameFrame, initialScene, 1);
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

    // Record frame if recording is active
    this.recorderService.recordFrameFromGameState(this.gameFrame);

    // Update media player if active
    this.gameFrame.getMediaPlayerEntity()?.update(deltaTimeStamp);
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render scenes
    this.gameFrame.getCurrentScene()?.render(this.context);
    this.gameFrame.getNextScene()?.render(this.context);

    // Render global UI entities
    this.gameFrame.getNotificationEntity()?.render(this.context);
    this.gameFrame.getLoadingIndicatorEntity()?.render(this.context);

    if (this.gameState.isDebugging()) {
      this.renderDebugInformation();
    }

    // Render media player last (on top of everything)
    this.gameFrame.getMediaPlayerEntity()?.render(this.context);

    // Dear ImGui rendering (always on top)
    this.debugService.render();
  }

  private renderDebugInformation(): void {
    this.context.save();

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
