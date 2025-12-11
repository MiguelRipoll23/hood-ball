import { BaseGameScene } from "../../../engine/scenes/base-game-scene.js";
import { MainBackgroundEntity } from "../../entities/backgrounds/main-background-entity.js";
import type { GameScene } from "../../../engine/interfaces/scenes/game-scene-interface.js";
import { GameState } from "../../../engine/models/game-state.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { SceneManagerService } from "../../../engine/services/gameplay/scene-manager-service.js";
import { container } from "../../../engine/services/di-container.js";

export class MainScene extends BaseGameScene {
  private scene: GameScene | null = null;

  constructor() {
    const gameState = container.get(GameState);
    const eventConsumerService = container.get(EventConsumerService);
    const sceneManagerService = container.get(SceneManagerService);
    super(gameState, eventConsumerService);
    this.sceneManagerService = sceneManagerService;
    // Pointer events should be cleared only after nested scenes have processed
    // them.
    this.clearPointerEventsAutomatically = false;
  }

  public activateScene(scene: GameScene): void {
    this.scene = scene;
    this.scene?.setOpacity(1);
    this.sceneManagerService?.setInitialScene(scene);
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
    // Update nested scenes first
    this.sceneManagerService?.getCurrentScene()?.setOpacity(this.opacity);
    this.sceneManagerService?.update(deltaTimeStamp);

    // Then update the base scene
    super.update(deltaTimeStamp);

    // Clear pointer events after both the nested and base scenes have consumed them
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
