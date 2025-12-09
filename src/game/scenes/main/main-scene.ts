import { BaseGameScene } from "../../../engine/scenes/base-game-scene.js";
import { MainBackgroundEntity } from "../../entities/backgrounds/main-background-entity.js";
import type { GameScene } from "../../../engine/interfaces/scenes/game-scene-interface.js";
import type { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import type { SceneManagerServiceContract } from "../../../engine/interfaces/services/scene/scene-manager-service-contract.js";

export class MainScene extends BaseGameScene {
  private scene: GameScene | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    sceneManagerService: SceneManagerServiceContract
  ) {
    super(gameState, eventConsumerService);
    this.sceneManagerService = sceneManagerService;
    // Pointer events should be cleared only after nested scenes have processed
    // them.
    this.clearPointerEventsAutomatically = false;
  }

  public activateScene(scene: GameScene): void {
    this.scene = scene;
    this.scene?.setOpacity(1);
    (this.sceneManagerService as SceneManagerServiceContract)?.setInitialScene(
      scene
    );
  }

  public override load(): void {
    this.createMainBackgroundEntity();

    if (this.scene === null) {
      console.warn("MainScene: No scene has been set");
    } else {
      this.scene?.load();
      super.load();
    }
  }

  public onTransitionEnd(): void {
    this.scene?.onTransitionEnd();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    // Update nested scenes after updating the base entities
    this.sceneManagerService?.getCurrentScene()?.setOpacity(this.opacity);
    this.sceneManagerService?.update(deltaTimeStamp);

    // Clear pointer events once all scenes have processed input
    this.clearPointerEvents();
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Must render the base scene first
    super.render(context);

    this.sceneManagerService?.render(context);
  }

  private createMainBackgroundEntity() {
    const mainBackgroundEntity = new MainBackgroundEntity(this.canvas);
    this.worldEntities.push(mainBackgroundEntity);
  }
}
