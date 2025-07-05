import { NotificationEntity } from "../entities/notification-entity.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import type { ScreenManager } from "../../interfaces/screens/screen-manager.js";
import { DebugEntity } from "../entities/debug-entity.js";
import { LoadingIndicatorEntity } from "../entities/loading-indicator-entity.js";

export class GameFrame implements ScreenManager {
  private currentScreen: GameScreen | null = null;
  private nextScreen: GameScreen | null = null;
  private notificationObject: NotificationEntity | null = null;
  private debugObject: DebugEntity | null = null;
  private loadingIndicatorObject: LoadingIndicatorEntity | null = null;

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

  public getNotificationEntity(): NotificationEntity | null {
    return this.notificationObject;
  }

  public setNotificationEntity(object: NotificationEntity | null): void {
    this.notificationObject = object;
  }

  public getDebugEntity(): DebugEntity | null {
    return this.debugObject;
  }

  public setDebugEntity(object: DebugEntity | null): void {
    this.debugObject = object;
  }

  public getLoadingIndicatorEntity(): LoadingIndicatorEntity | null {
    return this.loadingIndicatorObject;
  }

  public setLoadingIndicatorEntity(object: LoadingIndicatorEntity | null): void {
    this.loadingIndicatorObject = object;
  }
}
