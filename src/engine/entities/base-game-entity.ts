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
  public debugSettings: DebugSettings | null = null;

  /** Component map for the ECS-lite system. Keyed by componentType string. */
  private readonly components = new Map<string, Component>();

  constructor() {
    this.entityId = `${this.constructor.name}_${EntityRegistry.getNextEntityId()}`;
    EngineLogger.info("Entity", `${this.constructor.name} created`);
  }

  // ── Component System ──────────────────────────────────────────

  public addComponent<T extends Component>(component: T): T {
    const key = component.componentType;
    this.components.set(key, component);
    component.entity = this;
    component.init?.();
    return component;
  }

  public getComponent<T extends Component>(
    ctor: new (...args: never[]) => T,
  ): T | null {
    const key =
      (ctor as unknown as { componentType?: string }).componentType ?? ctor.name;
    return (this.components.get(key) as T) ?? null;
  }

  public hasComponent<T extends Component>(
    ctor: new (...args: never[]) => T,
  ): boolean {
    const key =
      (ctor as unknown as { componentType?: string }).componentType ?? ctor.name;
    return this.components.has(key);
  }

  public forEachComponent(fn: (component: Component) => void): void {
    this.components.forEach(fn);
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  public getId(): string { return this.entityId; }
  public setId(id: string): void { this.entityId = id; }

  public load() { EngineLogger.info("Entity", `${this.constructor.name} loaded`); this.loaded = true; }
  public hasLoaded(): boolean { return this.loaded; }
  public getState(): EntityStateType { return this.state; }
  public setState(state: EntityStateType): void { this.state = state; }
  public isRemoved(): boolean { return this.removed; }
  public setRemoved(removed: boolean): void { this.removed = removed; }
  public getOpacity(): number { return this.opacity; }
  public setOpacity(opacity: number): void { this.opacity = opacity; }

  protected applyOpacity(context: CanvasRenderingContext2D): void {
    if (context.globalAlpha > this.opacity) context.globalAlpha = this.opacity;
  }

  public setDebugSettings(debugSettings: DebugSettings | null): void {
    this.debugSettings = debugSettings;
    this.components.forEach((comp) => {
      if ("debugSettings" in comp) (comp as Record<string, unknown>).debugSettings = debugSettings;
    });
  }

  public reset(): void { /* override in subclasses */ }
  public serialize(): ArrayBuffer { return new ArrayBuffer(0); }
  public synchronize(_arrayBuffer: ArrayBuffer): void { /* override */ }
  public getReplayState(): ArrayBuffer | null { return null; }
  public applyReplayState(_arrayBuffer: ArrayBuffer): void { /* override */ }

  // ── Per-frame lifecycle ───────────────────────────────────────

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const scripts: { comp: Component; priority: number }[] = [];
    this.components.forEach((component) => {
      const prio = (component as { updatePriority?: number }).updatePriority;
      if (prio !== undefined) scripts.push({ comp: component, priority: prio });
    });
    scripts.sort((a, b) => a.priority - b.priority);
    const run = new Set<Component>();
    for (const { comp } of scripts) { comp.update?.(deltaTimeStamp); run.add(comp); }
    this.components.forEach((component) => {
      if (!run.has(component)) component.update?.(deltaTimeStamp);
    });
  }

  public render(context: CanvasRenderingContext2D): void {
    this.applyOpacity(context);
    this.components.forEach((component) => component.render?.(context));
  }
}
