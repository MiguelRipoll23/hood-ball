import { EntityStateType } from "../enums/entity-state-type.js";
import type { GameEntity } from "../models/game-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import type { SerializableEntity } from "../interfaces/entities/serializable-entity-interface.js";

export class BaseGameEntity implements GameEntity, SerializableEntity {
  protected loaded: boolean = false;
  protected state: EntityStateType = EntityStateType.Active;
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

  public getState(): EntityStateType {
    return this.state;
  }

  public setState(state: EntityStateType): void {
    this.state = state;

    if (this.state === EntityStateType.Inactive) {
      console.log(`${this.constructor.name} set to inactive`);
    }
  }

  public isRemoved(): boolean {
    return this.removed;
  }

  public setRemoved(removed: boolean): void {
    this.removed = removed;

    if (this.removed) {
      console.log(`${this.constructor.name} to be removed from scene`);
    }
  }

  public getOpacity(): number {
    return this.opacity;
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity;
  }

  protected applyOpacity(context: CanvasRenderingContext2D): void {
    // Apply desired entity opacity only if it's less than the scene opacity
    if (context.globalAlpha > this.opacity) {
      context.globalAlpha = this.opacity;
    }
  }

  public setDebugSettings(debugSettings: DebugSettings | null): void {
    this.debugSettings = debugSettings;
  }

  public update(_deltaTimeStamp: DOMHighResTimeStamp): void {}

  public render(_context: CanvasRenderingContext2D): void {}

  public serializeForRecording(): Record<string, unknown> {
    return {
      state: this.state,
      opacity: this.opacity,
    };
  }

  public deserializeFromRecording(data: Record<string, unknown>): void {
    if (typeof data.state === "number") {
      this.state = data.state as EntityStateType;
    }
    if (typeof data.opacity === "number") {
      this.opacity = data.opacity;
    }
  }
}
