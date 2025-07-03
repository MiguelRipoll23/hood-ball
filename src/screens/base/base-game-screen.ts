import { GamePointer } from "../../models/game-pointer.js";
import { LayerType } from "../../enums/layer-type.js";
import { BaseTappableGameObject } from "../../objects/base/base-tappable-game-object.js";
import type { GameObject } from "../../interfaces/objects/game-object.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import type { ScreenManager } from "../../interfaces/screens/screen-manager.js";
import { ScreenManagerService } from "../../services/screen-manager-service.js";
import { EventConsumerService } from "../../services/gameplay/event-consumer-service.js";
import { EventType } from "../../enums/event-type.js";
import type { GameState } from "../../models/game-state.js";
import { ServiceLocator } from "../../services/service-locator.js";

export class BaseGameScreen implements GameScreen {
  protected eventConsumerService: EventConsumerService;

  protected canvas: HTMLCanvasElement;
  protected screenManagerService: ScreenManagerService | null = null;

  protected loaded: boolean = false;
  protected opacity: number = 0;

  protected sceneObjects: GameObject[] = [];
  protected uiObjects: GameObject[] = [];

  private gamePointer: GamePointer;

  constructor(protected gameState: GameState) {
    console.log(`${this.constructor.name} created`);
    this.canvas = gameState.getCanvas();
    this.gamePointer = gameState.getGamePointer();
    this.eventConsumerService = ServiceLocator.get(EventConsumerService);
  }

  public isActive(): boolean {
    return this.opacity > 0;
  }

  public getScreenManagerService(): ScreenManager | null {
    return this.screenManagerService;
  }

  public setScreenManagerService(
    screenManagerService: ScreenManagerService
  ): void {
    this.screenManagerService = screenManagerService;
  }

  public load(): void {
    this.updateDebugStateForObjects();

    this.sceneObjects.forEach((object) => object.load());
    this.uiObjects.forEach((object) => object.load());

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

  public getUIObjects(): GameObject[] {
    return this.uiObjects;
  }

  public getSceneObjects(): GameObject[] {
    return this.sceneObjects;
  }

  public onTransitionStart(): void {
    console.log(`Transition to ${this.constructor.name} started`);
    this.updateDebugStateForObjects();
  }

  public onTransitionEnd(): void {
    console.log(`Transition to ${this.constructor.name} finished`);
  }

  public getTotalObjectsCount(): number {
    return this.sceneObjects.length + this.uiObjects.length;
  }

  public getLoadedObjectsCount(): number {
    return (
      this.sceneObjects.filter((object) => object.hasLoaded()).length +
      this.uiObjects.filter((object) => object.hasLoaded()).length
    );
  }

  public getObjectLayer(object: GameObject): LayerType {
    if (this.sceneObjects.includes(object)) {
      return LayerType.Scene;
    }

    if (this.uiObjects.includes(object)) {
      return LayerType.UI;
    }

    throw new Error("Object not found in any layer");
  }

  public addObjectToSceneLayer(object: GameObject): void {
    object.setDebugSettings(this.gameState.getDebugSettings());
    object.load();

    this.sceneObjects.push(object);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.eventConsumerService.consumeEvents();

    this.updateObjects(this.sceneObjects, deltaTimeStamp);
    this.updateObjects(this.uiObjects, deltaTimeStamp);

    this.uiObjects.forEach((object) => {
      this.deleteObjectIfRemoved(this.uiObjects, object);
    });

    this.sceneObjects.forEach((object) => {
      this.deleteObjectIfRemoved(this.sceneObjects, object);
    });

    this.handlePointerEvent();
  }

  public render(context: CanvasRenderingContext2D): void {
    context.globalAlpha = this.opacity;

    this.renderObjects(this.sceneObjects, context);
    this.renderObjects(this.uiObjects, context);

    context.globalAlpha = 1;
  }

  protected updateDebugStateForObjects(): void {
    const debugSettings = this.gameState.getDebugSettings();

    this.sceneObjects.forEach((object) =>
      object.setDebugSettings(debugSettings)
    );

    this.uiObjects.forEach((object) => object.setDebugSettings(debugSettings));
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

  private deleteObjectIfRemoved(layer: GameObject[], object: GameObject): void {
    if (object.isRemoved()) {
      const index = layer.indexOf(object);
      layer.splice(index, 1);
    }
  }

  private handlePointerEvent(): void {
    const tappableObjects = this.uiObjects
      .filter(
        (object): object is BaseTappableGameObject =>
          object instanceof BaseTappableGameObject
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
    objects: GameObject[],
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    objects.forEach((object) => {
      if (object.hasLoaded()) {
        object.update(deltaTimeStamp);
      }
    });
  }

  private renderObjects(
    objects: GameObject[],
    context: CanvasRenderingContext2D
  ): void {
    objects.forEach((object) => {
      if (object.hasLoaded()) {
        object.render(context);
      }
    });
  }
}
