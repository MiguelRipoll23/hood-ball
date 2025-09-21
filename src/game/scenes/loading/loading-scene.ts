import type { GameState } from "../../../core/models/game-state.js";
import { SceneTransitionService } from "@engine/services/scene/scene-transition-service.js";
import { injectable } from "@needle-di/core";
import { container } from "../../../core/services/di-container.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import { BaseGameScene } from "../../../core/scenes/base-game-scene.js";
import { WorldScene } from "../world/world-scene.js";
import { LoadingEntityFactory } from "./loading-entity-factory.js";
import type { LoadingEntities } from "./loading-entity-factory.js";
import { LoadingController } from "./loading-controller.js";

@injectable()
export class LoadingScene extends BaseGameScene {
  private sceneTransitionService: SceneTransitionService;
  private entities: LoadingEntities | null = null;
  private worldScene: WorldScene | null = null;
  private controller: LoadingController;
  private transitionStarted: boolean = false;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    sceneTransitionService: SceneTransitionService = container.get(
      SceneTransitionService
    )
  ) {
    super(gameState, eventConsumerService);
    this.sceneTransitionService = sceneTransitionService;
    this.controller = new LoadingController(gameState, eventConsumerService);
  }

  public override load(): void {
    const factory = new LoadingEntityFactory(this.canvas);
    this.entities = factory.createEntities();
    const { loadingBackgroundEntity, progressBarEntity } = this.entities!;
    this.worldEntities.push(loadingBackgroundEntity);
    this.uiEntities.push(progressBarEntity);

    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();

    this.worldScene = this.controller.createWorldScene();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const totalEntities = this.worldScene?.getTotalEntitiesCount() || 1;
    const loadedEntities = this.worldScene?.getLoadedEntitiesCount() || 0;

    this.entities?.progressBarEntity.setProgress(
      loadedEntities / totalEntities
    );

    if (
      !this.transitionStarted &&
      totalEntities > 0 &&
      loadedEntities === totalEntities
    ) {
      this.transitionStarted = true;
      this.sceneTransitionService.fadeOutAndIn(
        this.gameState.getGameFrame(),
        this.worldScene!,
        1,
        1
      );
    }

    super.update(deltaTimeStamp);
  }
}
