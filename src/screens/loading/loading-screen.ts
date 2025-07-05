import type { GameState } from "../../core/services/game-state.js";
import { ScreenTransitionService } from "../../core/services/screen-transition-service.js";
import { injectable } from "@needle-di/core";
import { container } from "../../core/services/di-container.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";
import { BaseGameScreen } from "../../core/scenes/base-game-screen.js";
import { WorldScreen } from "../world/world-screen.js";
import { LoadingEntityFactory } from "./loading-entity-factory.js";
import type { LoadingObjects } from "./loading-entity-factory.js";
import { LoadingController } from "./loading-controller.js";

@injectable()
export class LoadingScreen extends BaseGameScreen {
  private screenTransitionService: ScreenTransitionService;
  private objects: LoadingObjects | null = null;
  private worldScreen: WorldScreen | null = null;
  private controller: LoadingController;
  private transitionStarted: boolean = false;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    screenTransitionService: ScreenTransitionService = container.get(
      ScreenTransitionService
    )
  ) {
    super(gameState, eventConsumerService);
    this.screenTransitionService = screenTransitionService;
    this.controller = new LoadingController(gameState);
  }

  public override load(): void {
    const factory = new LoadingEntityFactory(this.canvas);
    this.objects = factory.createObjects();
    const { background, progressBar } = this.objects!;
    this.worldEntities.push(background);
    this.uiEntities.push(progressBar);

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.worldScreen = this.controller.createWorldScreen();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const totalObjects = this.worldScreen?.getTotalObjectsCount() || 1;
    const loadedObjects = this.worldScreen?.getLoadedObjectsCount() || 0;

    this.objects?.progressBar.setProgress(loadedObjects / totalObjects);

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

}
