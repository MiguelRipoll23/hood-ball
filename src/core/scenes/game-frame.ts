import { NotificationEntity } from "../entities/notification-entity.js";
import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import type { SceneManager } from "../../interfaces/scenes/scene-manager.js";
import { DebugEntity } from "../entities/debug-entity.js";
import { LoadingIndicatorEntity } from "../entities/loading-indicator-entity.js";

export class GameFrame implements SceneManager {
  private currentScreen: GameScene | null = null;
  private nextScreen: GameScene | null = null;
  private notificationObject: NotificationEntity | null = null;
  private debugObject: DebugEntity | null = null;
  private loadingIndicatorObject: LoadingIndicatorEntity | null = null;

  public getCurrentScreen(): GameScene | null {
    return this.currentScreen;
  }

  public getPreviousScreen(): GameScene | null {
    return null;
  }

  public setCurrentScreen(screen: GameScene): void {
    this.currentScreen = screen;
  }

  public getNextScreen(): GameScene | null {
    return this.nextScreen;
  }

  public setNextScreen(screen: GameScene | null): void {
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
