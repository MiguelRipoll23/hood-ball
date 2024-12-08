import { GameController } from "../../models/game-controller.js";
import { GamePointer } from "../../models/game-pointer.js";
import { LayerType } from "../../enums/layer-type.js";
import { BasePressableGameObject } from "../../objects/base/base-pressable-game-object.js";
import { GameObject } from "../../interfaces/object/game-object.js";
import { ScreenManagerService } from "../../services/screen-manager-service.js";
import { GameScreen } from "../../interfaces/screen/game-screen.js";

export class BaseGameScreen implements GameScreen {
  protected canvas: HTMLCanvasElement;
  protected screenManagerService: ScreenManagerService | null = null;

  protected loaded: boolean = false;
  protected opacity: number = 0;

  protected sceneObjects: GameObject[] = [];
  protected uiObjects: GameObject[] = [];

  private gamePointer: GamePointer;

  constructor(protected gameController: GameController) {
    console.log(`${this.constructor.name} created`);
    this.canvas = gameController.getCanvas();
    this.gamePointer = gameController.getGamePointer();
  }

  public isActive(): boolean {
    return this.opacity > 0;
  }

  public setScreenManagerService(
    screenManagerService: ScreenManagerService
  ): void {
    this.screenManagerService = screenManagerService;
  }

  public loadObjects(): void {
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

    [...this.sceneObjects, ...this.uiObjects].forEach((object) => {
      if (object.getOpacity() > opacity) {
        object.setOpacity(opacity);
      }
    });
  }

  public hasTransitionFinished(): void {
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

  public addObjectToLayer(layerId: LayerType, object: GameObject): void {
    object.setDebug(this.gameController.isDebugging());
    object.load();

    switch (layerId) {
      case LayerType.UI:
        this.uiObjects.push(object);
        break;

      case LayerType.Scene:
        this.sceneObjects.push(object);
        break;

      default:
        console.warn(`Unknown layer id ${layerId} for object`, object);
    }
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
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
    const debug = this.gameController.isDebugging();

    this.sceneObjects.forEach((object) => object.setDebug(debug));
    this.uiObjects.forEach((object) => object.setDebug(debug));
  }

  private deleteObjectIfRemoved(layer: GameObject[], object: GameObject): void {
    if (object.isRemoved()) {
      const index = layer.indexOf(object);
      layer.splice(index, 1);
    }
  }

  private handlePointerEvent(): void {
    const pressableObjects = this.uiObjects
      .filter(
        (object): object is BasePressableGameObject =>
          object instanceof BasePressableGameObject
      )
      .filter((object) => object.isActive())
      .reverse();

    for (const pressableObject of pressableObjects) {
      pressableObject.handlePointerEvent(this.gamePointer);

      if (pressableObject.isHovering() || pressableObject.isPressed()) {
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
