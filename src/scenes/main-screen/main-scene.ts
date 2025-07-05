import { BaseGameScene } from "../../core/scenes/base-game-scene.js";
import { SceneManagerService } from "../../core/services/scene-manager-service.js";
import { MainBackgroundEntity } from "../../entities/backgrounds/main-background-entity.js";
import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import type { GameState } from "../../core/services/game-state.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";

export class MainScene extends BaseGameScene {
  private screen: GameScene | null = null;

  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
    this.screenManagerService = new SceneManagerService();
  }

  public activateScreen(screen: GameScene): void {
    this.screen = screen;
    this.screen?.setOpacity(1);
    this.screenManagerService?.setInitialScreen(screen);
  }

  public override load(): void {
    this.createMainBackgroundEntity();

    if (this.screen === null) {
      console.warn("MainScreen: No screen has been set");
    } else {
      this.screen?.load();
      super.load();
    }
  }

  public onTransitionEnd(): void {
    this.screen?.onTransitionEnd();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    // No need to super.update() because the screenManagerService will handle the update

    this.screenManagerService?.getCurrentScreen()?.setOpacity(this.opacity);
    this.screenManagerService?.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Must render the base screen first
    super.render(context);

    this.screenManagerService?.render(context);
  }

  private createMainBackgroundEntity() {
    const mainBackgroundObject = new MainBackgroundEntity(this.canvas);
    this.worldEntities.push(mainBackgroundObject);
  }
}
