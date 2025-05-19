import { BaseGameScreen } from "./base/base-game-screen.js";
import { ScreenManagerService } from "../services/screen-manager-service.js";
import { MainBackgroundObject } from "../objects/backgrounds/main-background-object.js";
import { GameController } from "../models/game-controller.js";
import type { GameScreen } from "../interfaces/screen/game-screen.js";

export class MainScreen extends BaseGameScreen {
  private screen: GameScreen | null = null;

  constructor(gameController: GameController) {
    super(gameController);
  }

  public setScreen(screen: GameScreen): void {
    this.screen = screen;
    this.updateScreen(screen);
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

  public hasTransitionFinished(): void {
    this.screen?.hasTransitionFinished();
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

  private updateScreen(screen: GameScreen): void {
    // Set the screen to be fully visible
    this.screen?.setOpacity(1);

    this.screenManagerService = new ScreenManagerService(screen);
    this.screenManagerService.setCurrentScreen(screen);

    this.screen?.setScreenManagerService(this.screenManagerService);
  }

  private createMainBackgroundObject() {
    const mainBackgroundObject = new MainBackgroundObject(this.canvas);
    this.sceneObjects.push(mainBackgroundObject);
  }
}
