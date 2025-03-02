import { NotificationObject } from "../objects/common/notification-object.js";
import { GameScreen } from "../interfaces/screen/game-screen.js";
import { ScreenManager } from "../interfaces/screen/screen-manager.js";
import { DebugObject } from "../objects/common/debug-object.js";

export class GameFrame implements ScreenManager {
  private currentScreen: GameScreen | null = null;
  private nextScreen: GameScreen | null = null;
  private notificationObject: NotificationObject | null = null;
  private debugObject: DebugObject | null = null;

  public getCurrentScreen(): GameScreen | null {
    return this.currentScreen;
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
}
