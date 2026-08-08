import { EntityStateType } from "../enums/entity-state-type.js";
import type { GameEntity } from "../models/game-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { EntityRegistry } from "../services/entity-registry.js";
import { EngineLogger } from "../services/engine-logger.js";
import type { Component } from "../components/component.js";

export class BaseGameEntity implements GameEntity {
  protected loaded: boolean = false;
  protected state: EntityStateType = EntityStateType.Active;
  protected removed: boolean = false;
  protected opacity: number = 1;
  protected entityId: string;

  protected debugSettings: DebugSettings | null = null;

  /** Component map for the ECS-lite system. Keyed by constructor name. */
  private readonly components = new Map<string, Component>();

  constructor() {
    // Generate unique ID using counter and constructor name
    this.entityId = `${
      this.constructor.name
    }_${EntityRegistry.getNextEntityId()}`;
    EngineLogger.info("Entity", `${this.constructor.name} created`);
  }

  // ── Component System ──────────────────────────────────────────

  /**
   * Attach a component to this entity. If a component of the same type
   * already exists, it is replaced.
   */
  public addComponent<T extends Component>(component: T): T {
    const key = component.constructor.name;
    this.components.set(key, component);
    component.init?.();
    return component;
  }

  /**
   * Retrieve a component by its constructor. Returns null if not found.
   */
  public getComponent<T extends Component>(
    ctor: new (...args: never[]) => T,
  ): T | null {
    return (this.components.get(ctor.name) as T) ?? null;
  }

  /**
   * Check if a component of the given type exists on this entity.
   */
  public hasComponent<T extends Component>(
    ctor: new (...args: never[]) => T,
  ): boolean {
    return this.components.has(ctor.name);
  }

  /**
   * Iterate over all attached components.
   */
  public forEachComponent(fn: (component: Component) => void): void {
    this.components.forEach(fn);
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  /**
   * Returns the unique identifier for this entity.
   * Override this method in subclasses to provide custom ID logic.
   * Returns the auto-generated ID by default.
   */
  public getId(): string {
    return this.entityId;
  }

  /**
   * Sets the entity ID. Useful for restoring entities during replay.
   */
  public setId(id: string): void {
    this.entityId = id;
  }

  public load() {
    EngineLogger.info("Entity", `${this.constructor.name} loaded`);
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
      EngineLogger.info("Entity", `${this.constructor.name} set to inactive`);
    }
  }

  public isRemoved(): boolean {
    return this.removed;
  }

  public setRemoved(removed: boolean): void {
    this.removed = removed;

    if (this.removed) {
      EngineLogger.info("Entity", `${this.constructor.name} to be removed from scene`);
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
