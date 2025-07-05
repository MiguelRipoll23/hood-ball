import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import type { ISceneManagerService } from "../../interfaces/services/ui/scene-manager-service-interface.js";
import type { ISceneTransitionService } from "../../interfaces/services/ui/scene-transition-service-interface.js";
import { container } from "./di-container.js";

export class SceneManagerService implements ISceneManagerService {
  private stack: GameScene[] = [];
  private currentScreen: GameScene | null = null;
  private nextScreen: GameScene | null = null;

  private transitionService: ISceneTransitionService;

  constructor() {
    this.transitionService = container.get(SceneTransitionService);
  }

  public getTransitionService(): ISceneTransitionService {
    return this.transitionService;
  }

  public setInitialScreen(screen: GameScene): void {
    this.currentScreen = screen;
    this.currentScreen.setScreenManagerService(this);
    this.stack.push(screen);
  }

  public getPreviousScreen(): GameScene | null {
    if (this.currentScreen === null) {
      return null;
    }

    const index = this.stack.indexOf(this.currentScreen);

    return this.stack[index - 1] || null;
  }

  public getCurrentScreen(): GameScene | null {
    return this.currentScreen;
  }

  public getNextScreen(): GameScene | null {
    return this.nextScreen;
  }

  public setCurrentScreen(currentScreen: GameScene): void {
    this.currentScreen = currentScreen;
  }

  public setNextScreen(nextScreen: GameScene | null): void {
    this.nextScreen = nextScreen;
    this.nextScreen?.setScreenManagerService(this);

    if (nextScreen === null) {
      return;
    }

    this.handleStack(nextScreen);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.transitionService.update(deltaTimeStamp);

    this.currentScreen?.update(deltaTimeStamp);
    this.nextScreen?.update(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.currentScreen?.render(context);
    this.nextScreen?.render(context);
  }

  private handleStack(nextScreen: GameScene): void {
    if (this.stack.includes(nextScreen)) {
      // back to previous screen
      this.stack.pop();
    } else {
      // new screen
      this.stack.push(nextScreen);
    }

    console.log("Screens stack", this.stack);
  }
}
