import { NotificationObject } from "../objects/common/notification-object.js";
import { GameScreen } from "../interfaces/screen/game-screen.js";
import { ScreenManager } from "../interfaces/screen/screen-manager.js";

export class GameFrame implements ScreenManager {
  private currentScreen: GameScreen | null = null;
  private nextScreen: GameScreen | null = null;
  private notificationObject: NotificationObject | null = null;

  public getCurrentScreen(): GameScreen | null {
    return this.currentScreen;
  }

  public getNextScreen(): GameScreen | null {
    return this.nextScreen;
  }

  public getNotificationObject(): NotificationObject | null {
    return this.notificationObject;
  }

  public setCurrentScreen(screen: GameScreen): void {
    this.currentScreen = screen;
  }

  public setNextScreen(screen: GameScreen | null): void {
    this.nextScreen = screen;
  }

  public setNotificationObject(object: NotificationObject | null): void {
    this.notificationObject = object;
  }
}
