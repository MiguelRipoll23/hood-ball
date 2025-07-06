import { BaseGameScene } from "../../../core/scenes/base-game-scene.js";
import { SceneManagerService } from "../../../core/services/gameplay/scene-manager-service.js";
import { MainBackgroundEntity } from "../../entities/backgrounds/main-background-entity.js";
import type { GameScene } from "../../../core/interfaces/scenes/game-scene.js";
import type { GameState } from "../../../core/models/game-state.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";

export class MainScene extends BaseGameScene {
  private scene: GameScene | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    super(gameState, eventConsumerService);
    this.sceneManagerService = new SceneManagerService();
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
    // No need to super.update() because the sceneManagerService will handle the update
    super.update(deltaTimeStamp);

    this.sceneManagerService?.getCurrentScene()?.setOpacity(this.opacity);
    this.sceneManagerService?.update(deltaTimeStamp);
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
