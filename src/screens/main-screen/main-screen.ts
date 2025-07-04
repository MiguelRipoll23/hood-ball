import { BaseGameScreen } from "../base/base-game-screen.js";
import { ScreenManagerService } from "../../services/ui/screen-manager-service.js";
import { MainBackgroundObject } from "../../objects/backgrounds/main-background-object.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import type { GameState } from "../../models/game-state.js";
import { EventConsumerService } from "../../services/gameplay/event-consumer-service.js";

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
    this.createMainBackgroundObject();

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

  private createMainBackgroundObject() {
    const mainBackgroundObject = new MainBackgroundObject(this.canvas);
    this.sceneObjects.push(mainBackgroundObject);
  }
}
