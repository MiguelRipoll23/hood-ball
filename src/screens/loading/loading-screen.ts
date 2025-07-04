import type { GameState } from "../../models/game-state.js";
import { LoadingBackgroundObject } from "../../objects/backgrounds/loading-background-object.js";
import { ProgressBarObject } from "../../objects/common/progress-bar-object.js";
import { ScreenTransitionService } from "../../services/screen-transition-service.js";
import { injectable, inject } from "@needle-di/core";
import { container } from "../../services/di-container.js";
import { EventConsumerService } from "../../services/gameplay/event-consumer-service.js";
import { BaseGameScreen } from "../base/base-game-screen.js";
import { WorldScreen } from "../world/world-screen.js";

@injectable()
export class LoadingScreen extends BaseGameScreen {
  private screenTransitionService: ScreenTransitionService;
  private progressBarObject: ProgressBarObject | null = null;
  private worldScreen: WorldScreen | null = null;
  private transitionStarted: boolean = false;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    screenTransitionService = inject(ScreenTransitionService)
  ) {
    super(gameState, eventConsumerService);
    this.screenTransitionService = screenTransitionService;
  }

  public override load(): void {
    this.createBackgroundObject();
    this.loadProgressBarObject();

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.worldScreen = new WorldScreen(
      this.gameState,
      container.get(EventConsumerService)
    );
    this.worldScreen.load();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const totalObjects = this.worldScreen?.getTotalObjectsCount() || 1;
    const loadedObjects = this.worldScreen?.getLoadedObjectsCount() || 0;

    this.progressBarObject?.setProgress(loadedObjects / totalObjects);

    if (
      !this.transitionStarted &&
      totalObjects > 0 &&
      loadedObjects === totalObjects
    ) {
      this.transitionStarted = true;
      this.screenTransitionService.fadeOutAndIn(
        this.gameState.getGameFrame(),
        this.worldScreen!,
        1,
        1
      );
    }

    super.update(deltaTimeStamp);
  }

  private createBackgroundObject() {
    const loadingBackgroundObject = new LoadingBackgroundObject(this.canvas);
    this.sceneObjects.push(loadingBackgroundObject);
  }

  private loadProgressBarObject(): void {
    this.progressBarObject = new ProgressBarObject(this.canvas);
    this.progressBarObject?.setText("Loading world screen....");
    this.uiObjects.push(this.progressBarObject);
  }
}
