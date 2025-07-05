import { NotificationEntity } from "../entities/notification-entity.js";
import type { GameScene } from "../../game/interfaces/scenes/game-scene.js";
import type { SceneManager } from "../../game/interfaces/scenes/scene-manager.js";
import { DebugEntity } from "../entities/debug-entity.js";
import { LoadingIndicatorEntity } from "../entities/loading-indicator-entity.js";

export class GameFrame implements SceneManager {
  private currentScene: GameScene | null = null;
  private nextScene: GameScene | null = null;
  private notificationEntity: NotificationEntity | null = null;
  private debugEntity: DebugEntity | null = null;
  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;

  public getCurrentScene(): GameScene | null {
    return this.currentScene;
  }

  public getPreviousScene(): GameScene | null {
    return null;
  }

  public setCurrentScene(scene: GameScene): void {
    this.currentScene = scene;
  }

  public getNextScene(): GameScene | null {
    return this.nextScene;
  }

  public setNextScene(scene: GameScene | null): void {
    this.nextScene = scene;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.currentScene?.update(deltaTimeStamp);
    this.nextScene?.update(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.currentScene?.render(context);
    this.nextScene?.render(context);
  }

  public getNotificationEntity(): NotificationEntity | null {
    return this.notificationEntity;
  }

  public setNotificationEntity(entity: NotificationEntity | null): void {
    this.notificationEntity = entity;
  }

  public getDebugEntity(): DebugEntity | null {
    return this.debugEntity;
  }

  public setDebugEntity(entity: DebugEntity | null): void {
    this.debugEntity = entity;
  }

  public getLoadingIndicatorEntity(): LoadingIndicatorEntity | null {
    return this.loadingIndicatorEntity;
  }

  public setLoadingIndicatorEntity(
    entity: LoadingIndicatorEntity | null
  ): void {
    this.loadingIndicatorEntity = entity;
  }
}
