import { NotificationObject } from "../objects/common/notification-object.js";
import type { GameScreen } from "../interfaces/screens/game-screen.js";
import { DebugObject } from "../debug/debug-object.js";

export class GameFrame {
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
}
