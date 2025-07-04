import { NotificationObject } from "../entities/notification-object.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import type { ScreenManager } from "../../interfaces/screens/screen-manager.js";
import { DebugObject } from "../entities/debug-object.js";
import { LoadingIndicatorObject } from "../entities/loading-indicator-object.js";

export class GameFrame implements ScreenManager {
  private currentScreen: GameScreen | null = null;
  private nextScreen: GameScreen | null = null;
  private notificationObject: NotificationObject | null = null;
  private debugObject: DebugObject | null = null;
  private loadingIndicatorObject: LoadingIndicatorObject | null = null;

  public getCurrentScreen(): GameScreen | null {
    return this.currentScreen;
  }

  public getPreviousScreen(): GameScreen | null {
    return null;
  }

  public setCurrentScreen(screen: GameScreen): void {
    this.currentScreen = screen;
  }

  public getNextScreen(): GameScreen | null {
    return this.nextScreen;
  }

  public setNextScreen(screen: GameScreen | null): void {
    this.nextScreen = screen;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.currentScreen?.update(deltaTimeStamp);
    this.nextScreen?.update(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.currentScreen?.render(context);
    this.nextScreen?.render(context);
  }

  public getNotificationObject(): NotificationObject | null {
    return this.notificationObject;
  }

  public setNotificationObject(object: NotificationObject | null): void {
    this.notificationObject = object;
  }

  public getDebugObject(): DebugObject | null {
    return this.debugObject;
  }

  public setDebugObject(object: DebugObject | null): void {
    this.debugObject = object;
  }

  public getLoadingIndicatorObject(): LoadingIndicatorObject | null {
    return this.loadingIndicatorObject;
  }

  public setLoadingIndicatorObject(object: LoadingIndicatorObject | null): void {
    this.loadingIndicatorObject = object;
  }
}
