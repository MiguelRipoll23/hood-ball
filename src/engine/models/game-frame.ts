import { NotificationEntity } from "../entities/notification-entity.ts";
import type { GameScene } from "../interfaces/scenes/game-scene-interface.ts";
import type { SceneManager } from "../interfaces/scenes/scene-manager-interface.ts";
import { DebugEntity } from "../entities/debug-entity.ts";
import { LoadingIndicatorEntity } from "../entities/loading-indicator-entity.ts";
import { MediaPlayerEntity } from "../entities/media-player-entity.ts";

export class GameFrame implements SceneManager {
  private currentScene: GameScene | null = null;
  private nextScene: GameScene | null = null;
  private notificationEntity: NotificationEntity | null = null;
  private debugEntity: DebugEntity | null = null;
  private loadingIndicatorEntity: LoadingIndicatorEntity | null = null;
  private mediaPlayerEntity: MediaPlayerEntity | null = null;

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

  public getMediaPlayerEntity(): MediaPlayerEntity | null {
    return this.mediaPlayerEntity;
  }

  public setMediaPlayerEntity(entity: MediaPlayerEntity | null): void {
    this.mediaPlayerEntity = entity;
  }
}
