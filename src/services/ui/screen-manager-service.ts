import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import { ScreenTransitionService } from "./screen-transition-service.js";
import type { IScreenManagerService } from "../../interfaces/services/ui/screen-manager-service-interface.js";
import type { IScreenTransitionService } from "../../interfaces/services/ui/screen-transition-service-interface.js";
import { container } from "../di-container.js";

export class ScreenManagerService implements IScreenManagerService {
  private stack: GameScreen[] = [];
  private currentScreen: GameScreen | null = null;
  private nextScreen: GameScreen | null = null;

  private transitionService: IScreenTransitionService;

  constructor() {
    this.transitionService = container.get(ScreenTransitionService);
  }

  public getTransitionService(): IScreenTransitionService {
    return this.transitionService;
  }

  public setInitialScreen(screen: GameScreen): void {
    this.currentScreen = screen;
    this.currentScreen.setScreenManagerService(this);
    this.stack.push(screen);
  }

  public getPreviousScreen(): GameScreen | null {
    if (this.currentScreen === null) {
      return null;
    }

    const index = this.stack.indexOf(this.currentScreen);

    return this.stack[index - 1] || null;
  }

  public getCurrentScreen(): GameScreen | null {
    return this.currentScreen;
  }

  public getNextScreen(): GameScreen | null {
    return this.nextScreen;
  }

  public setCurrentScreen(currentScreen: GameScreen): void {
    this.currentScreen = currentScreen;
  }

  public setNextScreen(nextScreen: GameScreen | null): void {
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

  private handleStack(nextScreen: GameScreen): void {
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
