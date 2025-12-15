import { EntityStateType } from "../enums/entity-state-type.js";
import type { GameEntity } from "../models/game-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { EntityRegistry } from "../services/entity-registry.js";

export class BaseGameEntity implements GameEntity {
  protected id: string;
  protected typeId: number | null = null;

  protected loaded: boolean = false;
  protected state: EntityStateType = EntityStateType.Active;
  protected removed: boolean = false;
  protected opacity: number = 1;

  protected debugSettings: DebugSettings | null = null;

  constructor() {
    // Generate unique ID using counter and constructor name
    this.id = `${
      this.constructor.name
    }_${EntityRegistry.getNextId()}`;
    console.log(`${this.constructor.name} created`);
  }

  public static getTypeId(): number {
    throw new Error("Method not implemented.");
  }

  /**
   * Returns the unique identifier for this entity.
   * Override this method in subclasses to provide custom ID logic.
   * Returns the auto-generated ID by default.
   */
  public getId(): string {
    return this.id;
  }

  public getTypeId(): number | null {
    return this.typeId;
  }

  public setTypeId(typeId: number): void {
    this.typeId = typeId;
  }

  /**
   * Sets the entity ID. Useful for restoring entities during replay.
   */
  public setId(id: string): void {
    this.id = id;
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

  public getReplayState(): ArrayBuffer | null {
    // Base implementation returns null - override in subclasses that need it
    return null;
  }

  public applyReplayState(_arrayBuffer: ArrayBuffer): void {
    // Base implementation does nothing - override in subclasses that need it
  }

  public update(_deltaTimeStamp: DOMHighResTimeStamp): void {}

  public render(_context: CanvasRenderingContext2D): void {}
}
