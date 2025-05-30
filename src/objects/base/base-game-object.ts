import { ObjectStateType } from "../../enums/object-state-type.js";
import type { GameObject } from "../../interfaces/objects/game-object.js";
import type { DebugSettings } from "../../models/debug-settings.js";

export class BaseGameObject implements GameObject {
  protected loaded: boolean = false;
  protected state: ObjectStateType = ObjectStateType.Active;
  protected removed: boolean = false;
  protected opacity: number = 1;

  protected debugSettings: DebugSettings | null = null;

  constructor() {
    console.log(`${this.constructor.name} created`);
  }

  public load() {
    console.log(`${this.constructor.name} loaded`);
    this.loaded = true;
  }

  public hasLoaded(): boolean {
    return this.loaded;
  }

  public getState(): ObjectStateType {
    return this.state;
  }

  public setState(state: ObjectStateType): void {
    this.state = state;

    if (this.state === ObjectStateType.Inactive) {
      console.log(`${this.constructor.name} set to inactive`);
    }
  }

  public isRemoved(): boolean {
    return this.removed;
  }

  public setRemoved(removed: boolean): void {
    this.removed = removed;

    if (this.removed) {
      console.log(`${this.constructor.name} to be removed from screen`);
    }
  }

  public getOpacity(): number {
    return this.opacity;
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity;
  }

  public setDebugSettings(debugSettings: DebugSettings | null): void {
    this.debugSettings = debugSettings;
  }

  public update(_deltaTimeStamp: DOMHighResTimeStamp): void {}

  public render(_context: CanvasRenderingContext2D): void {}
}
