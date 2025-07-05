import { GamePointer } from "../services/game-pointer.js";
import { LayerType } from "../constants/layer-type.js";
import { BaseTappableGameEntity } from "../entities/base-tappable-game-entity.js";
import type { GameEntity } from "../../interfaces/entities/game-entity.js";
import type { GameScene } from "../../interfaces/scenes/game-scene.js";
import type { SceneManager } from "../../interfaces/scenes/scene-manager.js";
import { SceneManagerService } from "../services/scene-manager-service.js";
import { EventConsumerService } from "../services/event-consumer-service.js";
import { EventType } from "../../enums/event-type.js";
import type { GameState } from "../services/game-state.js";

export class BaseGameScene implements GameScene {
  protected eventConsumerService: EventConsumerService;

  protected canvas: HTMLCanvasElement;
  protected screenManagerService: SceneManagerService | null = null;

  protected loaded: boolean = false;
  protected opacity: number = 0;

  protected worldEntities: GameEntity[] = [];
  protected uiEntities: GameEntity[] = [];

  private gamePointer: GamePointer;

  constructor(
    protected gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    console.log(`${this.constructor.name} created`);
    this.canvas = gameState.getCanvas();
    this.gamePointer = gameState.getGamePointer();
    this.eventConsumerService = eventConsumerService;
  }

  public isActive(): boolean {
    return this.opacity > 0;
  }

  public getScreenManagerService(): SceneManager | null {
    return this.screenManagerService;
  }

  public setScreenManagerService(
    screenManagerService: SceneManagerService
  ): void {
    this.screenManagerService = screenManagerService;
  }

  public load(): void {
    this.updateDebugStateForObjects();

    this.worldEntities.forEach((object) => object.load());
    this.uiEntities.forEach((object) => object.load());

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

  public getUIObjects(): GameEntity[] {
    return this.uiEntities;
  }

  public getSceneObjects(): GameEntity[] {
    return this.worldEntities;
  }

  public onTransitionStart(): void {
    console.log(`Transition to ${this.constructor.name} started`);
    this.updateDebugStateForObjects();
  }

  public onTransitionEnd(): void {
    console.log(`Transition to ${this.constructor.name} finished`);
  }

  public getTotalObjectsCount(): number {
    return this.worldEntities.length + this.uiEntities.length;
  }

  public getLoadedObjectsCount(): number {
    return (
      this.worldEntities.filter((object) => object.hasLoaded()).length +
      this.uiEntities.filter((object) => object.hasLoaded()).length
    );
  }

  public getObjectLayer(object: GameEntity): LayerType {
    if (this.worldEntities.includes(object)) {
      return LayerType.Scene;
    }

    if (this.uiEntities.includes(object)) {
      return LayerType.UI;
    }

    throw new Error("Object not found in any layer");
  }

  public addObjectToSceneLayer(object: GameEntity): void {
    object.setDebugSettings(this.gameState.getDebugSettings());
    object.load();

    this.worldEntities.push(object);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.updateObjects(this.worldEntities, deltaTimeStamp);
    this.updateObjects(this.uiEntities, deltaTimeStamp);

    this.uiEntities.forEach((object) => {
      this.deleteObjectIfRemoved(this.uiEntities, object);
    });

    this.worldEntities.forEach((object) => {
      this.deleteObjectIfRemoved(this.worldEntities, object);
    });

    this.handlePointerEvent();
  }

  public render(context: CanvasRenderingContext2D): void {
    context.globalAlpha = this.opacity;

    this.renderObjects(this.worldEntities, context);
    this.renderObjects(this.uiEntities, context);

    context.globalAlpha = 1;
  }

  protected updateDebugStateForObjects(): void {
    const debugSettings = this.gameState.getDebugSettings();

    this.worldEntities.forEach((object) =>
      object.setDebugSettings(debugSettings)
    );

    this.uiEntities.forEach((object) => object.setDebugSettings(debugSettings));
  }

  protected subscribeToLocalEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void
  ) {
    this.eventConsumerService.subscribeToLocalEvent(eventType, eventCallback);

    console.log(
      `${this.constructor.name} subscribed to local event ${EventType[eventType]}`
    );
  }

  protected subscribeToRemoteEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void
  ) {
    this.eventConsumerService.subscribeToRemoteEvent(eventType, eventCallback);

    console.log(
      `${this.constructor.name} subscribed to remote event ${EventType[eventType]}`
    );
  }

  private deleteObjectIfRemoved(layer: GameEntity[], object: GameEntity): void {
    if (object.isRemoved()) {
      const index = layer.indexOf(object);
      layer.splice(index, 1);
    }
  }

  private handlePointerEvent(): void {
    const tappableObjects = this.uiEntities
      .filter(
        (object): object is BaseTappableGameEntity =>
          object instanceof BaseTappableGameEntity
      )
      .filter((object) => object.isActive())
      .reverse();

    for (const tappableObject of tappableObjects) {
      tappableObject.handlePointerEvent(this.gamePointer);

      if (tappableObject.isHovering() || tappableObject.isPressed()) {
        break;
      }
    }

    this.gamePointer.setPressed(false);
  }

  private updateObjects(
    objects: GameEntity[],
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    objects.forEach((object) => {
      if (object.hasLoaded()) {
        object.update(deltaTimeStamp);
      }
    });
  }

  private renderObjects(
    objects: GameEntity[],
    context: CanvasRenderingContext2D
  ): void {
    objects.forEach((object) => {
      if (object.hasLoaded()) {
        object.render(context);
      }
    });
  }

  protected returnToPreviousScreen(
    crossfadeDurationSeconds: number = 0.2
  ): void {
    const previousScreen =
      this.screenManagerService?.getPreviousScreen() ?? null;

    if (previousScreen === null) {
      return;
    }

    console.log("Returning to", previousScreen.constructor.name);

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(this.screenManagerService, previousScreen, crossfadeDurationSeconds);
  }
}
