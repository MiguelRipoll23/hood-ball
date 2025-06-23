import { BaseGameScreen } from "./base/base-game-screen.js";
import { ScreenManagerService } from "../services/screen-manager-service.js";
import { MainBackgroundObject } from "../objects/backgrounds/main-background-object.js";
import type { GameScreen } from "../interfaces/screen/game-screen.js";
import type { GameState } from "../models/game-state.js";

export class MainScreen extends BaseGameScreen {
  private screen: GameScreen | null = null;

  constructor(gameState: GameState) {
    super(gameState);
    this.screenManagerService = new ScreenManagerService();
  }

  public setScreen(screen: GameScreen): void {
    console.log("MainScreen: Setting new screen", screen.constructor.name);
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

  private updateScreen(screen: GameScreen): void {
    // Set the screen to be fully visible
    this.screen?.setOpacity(1);
    this.screenManagerService?.setInitialScreen(screen);
  }

  private createMainBackgroundObject() {
    const mainBackgroundObject = new MainBackgroundObject(this.canvas);
    this.sceneObjects.push(mainBackgroundObject);
  }
}
