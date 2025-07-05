import { BaseGameScreen } from "../../core/scenes/base-game-screen.js";
import { ScreenManagerService } from "../../core/services/screen-manager-service.js";
import { MainBackgroundEntity } from "../../entities/backgrounds/main-background-entity.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import type { GameState } from "../../core/services/game-state.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";

export class MainScreen extends BaseGameScreen {
  private screen: GameScreen | null = null;

  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
    super(gameState, eventConsumerService);
    this.screenManagerService = new ScreenManagerService();
  }

  public activateScreen(screen: GameScreen): void {
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
    this.sceneObjects.push(mainBackgroundObject);
  }
}
