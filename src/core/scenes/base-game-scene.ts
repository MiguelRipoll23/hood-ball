import { GamePointer } from "@engine/models/game-pointer.js";
import { LayerType } from "../enums/layer-type.js";
import { BaseTappableGameEntity } from "../entities/base-tappable-game-entity.js";
import type { GameEntity } from "@engine/models/game-entity.js";
import type { GameScene } from "../interfaces/scenes/game-scene.js";
import type { SceneManager } from "../interfaces/scenes/scene-manager.js";
import { SceneManagerService } from "@engine/services/scene/scene-manager-service.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import type { EventSubscription } from "../../game/types/event-subscription.js";
import { CameraService } from "@engine/services/render/camera-service.js";
import { container } from "../services/di-container.js";
import { EventType } from "../../game/enums/event-type.js";
import type { GameState } from "../models/game-state.js";

export class BaseGameScene implements GameScene {
  protected eventConsumerService: EventConsumerService;

  private localEventSubscriptions: EventSubscription[] = [];
  private remoteEventSubscriptions: EventSubscription[] = [];

  protected canvas: HTMLCanvasElement;
  protected sceneManagerService: SceneManagerService | null = null;

  protected loaded: boolean = false;
  protected opacity: number = 0;

  protected worldEntities: GameEntity[] = [];
  protected uiEntities: GameEntity[] = [];

  protected readonly cameraService: CameraService;

  private gamePointer: GamePointer;
  /**
   * Indicates whether pointer events should be cleared automatically
   * after handling input in {@link update}. Subclasses can override
   * {@link shouldClearPointerEvents} to delay or disable clearing
   * when delegating events to nested scenes.
  */
  protected clearPointerEventsAutomatically = true;

  /**
   * Determines if pointer events should be cleared at the end of
   * the default update cycle.
  */
  protected shouldClearPointerEvents(): boolean {
    return this.clearPointerEventsAutomatically;
  }

  /**
   * Clears the current pressed state of the game pointer. Subclasses may call
   * this manually when deferring pointer handling to nested scenes.
  */
  protected clearPointerEvents(): void {
    this.gamePointer.clearPressed();
  }

  constructor(
    protected gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    console.log(`${this.constructor.name} created`);
    this.canvas = gameState.getCanvas();
    this.gamePointer = gameState.getGamePointer();
    this.eventConsumerService = eventConsumerService;
    this.cameraService = container.get(CameraService);
  }

  public isActive(): boolean {
    return this.opacity > 0;
  }

  public getSceneManagerService(): SceneManager | null {
    return this.sceneManagerService;
  }

  public setSceneManagerService(
    sceneManagerService: SceneManagerService
  ): void {
    this.sceneManagerService = sceneManagerService;
  }

  public load(): void {
    this.updateDebugStateForEntities();

    this.worldEntities.forEach((entity) => entity.load());
    this.uiEntities.forEach((entity) => entity.load());

    console.log(`${this.constructor.name} loaded`);

    this.loaded = true;
  }

  public hasLoaded(): boolean {
    return this.loaded;
  }

  public getOpacity(): number {
    return this.opacity;
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity;
  }

  public getUIEntities(): GameEntity[] {
    return this.uiEntities;
  }

  public getWorldEntities(): GameEntity[] {
    return this.worldEntities;
  }

  public onTransitionStart(): void {
    console.log(`Transition to ${this.constructor.name} started`);
    this.updateDebugStateForEntities();
  }

  public onTransitionEnd(): void {
    console.log(`Transition to ${this.constructor.name} finished`);
  }

  public getTotalEntitiesCount(): number {
    return this.worldEntities.length + this.uiEntities.length;
  }

  public getLoadedEntitiesCount(): number {
    return (
      this.worldEntities.filter((entity) => entity.hasLoaded()).length +
      this.uiEntities.filter((entity) => entity.hasLoaded()).length
    );
  }

  public getEntityLayer(entity: GameEntity): LayerType {
    if (this.worldEntities.includes(entity)) {
      return LayerType.Scene;
    }

    if (this.uiEntities.includes(entity)) {
      return LayerType.UI;
    }

    throw new Error("Entity not found in any layer");
  }

  public addEntityToSceneLayer(entity: GameEntity): void {
    entity.setDebugSettings(this.gameState.getDebugSettings());
    entity.load();

    this.worldEntities.push(entity);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.cameraService.update(deltaTimeStamp);
    this.updateEntities(this.worldEntities, deltaTimeStamp);
    this.updateEntities(this.uiEntities, deltaTimeStamp);

    for (let i = this.uiEntities.length - 1; i >= 0; i--) {
      this.deleteEntityIfRemoved(this.uiEntities, this.uiEntities[i]);
    }

    for (let i = this.worldEntities.length - 1; i >= 0; i--) {
      this.deleteEntityIfRemoved(this.worldEntities, this.worldEntities[i]);
    }

    this.handlePointerEvent();
    if (this.shouldClearPointerEvents()) {
      this.clearPointerEvents();
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();
    this.cameraService.applyTransform(context);

    context.globalAlpha = this.opacity;

    this.renderEntities(this.worldEntities, context);
    this.renderEntities(this.uiEntities, context);

    context.globalAlpha = 1;
    context.restore();
  }

  protected updateDebugStateForEntities(): void {
    const debugSettings = this.gameState.getDebugSettings();

    this.worldEntities.forEach((entity) =>
      entity.setDebugSettings(debugSettings)
    );

    this.uiEntities.forEach((entity) => entity.setDebugSettings(debugSettings));
  }

  protected subscribeToLocalEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void
  ) {
    const sub = this.eventConsumerService.subscribeToLocalEvent(
      eventType,
      eventCallback
    );
    this.localEventSubscriptions.push(sub);

    console.log(
      `${this.constructor.name} subscribed to local event ${EventType[eventType]}`
    );
  }

  protected subscribeToRemoteEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void
  ) {
    const sub = this.eventConsumerService.subscribeToRemoteEvent(
      eventType,
      eventCallback
    );
    this.remoteEventSubscriptions.push(sub);

    console.log(
      `${this.constructor.name} subscribed to remote event ${EventType[eventType]}`
    );
  }

  private deleteEntityIfRemoved(layer: GameEntity[], entity: GameEntity): void {
    if (entity.isRemoved()) {
      const index = layer.indexOf(entity);
      layer.splice(index, 1);
    }
  }

  private handlePointerEvent(): void {
    const tappableEntities = this.uiEntities
      .filter(
        (entity): entity is BaseTappableGameEntity =>
          entity instanceof BaseTappableGameEntity
      )
      .filter((entity) => entity.isActive())
      .reverse();

    for (const tappableEntity of tappableEntities) {
      tappableEntity.handlePointerEvent(this.gamePointer);

      if (tappableEntity.isHovering() || tappableEntity.isPressed()) {
        break;
      }
    }
  }

  private updateEntities(
    entities: GameEntity[],
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    entities.forEach((entity) => {
      if (entity.hasLoaded()) {
        entity.update(deltaTimeStamp);
      }
    });
  }

  private renderEntities(
    entities: GameEntity[],
    context: CanvasRenderingContext2D
  ): void {
    entities.forEach((entity) => {
      if (entity.hasLoaded()) {
        entity.render(context);
      }
    });
  }

  protected returnToPreviousScene(
    crossfadeDurationSeconds: number = 0.2
  ): void {
    const previousScene = this.sceneManagerService?.getPreviousScene() ?? null;

    if (previousScene === null) {
      return;
    }

    previousScene.resubscribeEvents();

    console.log("Returning to", previousScene.constructor.name);

    this.sceneManagerService
      ?.getTransitionService()
      .crossfade(
        this.sceneManagerService,
        previousScene,
        crossfadeDurationSeconds
      );
  }

  public resubscribeEvents(): void {
    // Scenes can override this if they need to bind events again after
    // being disposed when returning from the stack.
  }

  public dispose(): void {
    this.localEventSubscriptions.forEach((sub) =>
      this.eventConsumerService.unsubscribeFromLocalEvent(sub)
    );
    this.remoteEventSubscriptions.forEach((sub) =>
      this.eventConsumerService.unsubscribeFromRemoteEvent(sub)
    );
    this.localEventSubscriptions = [];
    this.remoteEventSubscriptions = [];
  }
}
