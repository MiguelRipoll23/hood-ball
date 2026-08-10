import { EntityStateType } from "../enums/entity-state-type.js";
import type { GameEntity } from "../models/game-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { EntityRegistry } from "../services/entity-registry.js";
import { EngineLogger } from "../services/engine-logger.js";
import type { Component } from "../components/component.js";
import { TransformComponent } from "../components/transform-component.js";
import { PhysicsComponent } from "../components/physics-component.js";
import { CollisionComponent } from "../components/collision-component.js";
import { NetworkComponent } from "../components/network-component.js";
import { InputComponent } from "../components/input-component.js";
import { AnimationComponent } from "../components/animation-component.js";
import type { EntityAnimationService } from "../services/gameplay/entity-animation-service.js";
import type { Player } from "../interfaces/models/player-interface.js";
import type { HitboxEntity } from "./hitbox-entity.js";
import type { GamePointerContract } from "../interfaces/input/game-pointer-interface.js";
import type { EntityType } from "../enums/entity-type.js";

export class BaseGameEntity implements GameEntity {
  protected loaded: boolean = false;
  protected state: EntityStateType = EntityStateType.Active;
  protected removed: boolean = false;
  protected opacity: number = 1;
  protected entityId: string;
  public debugSettings: DebugSettings | null = null;

  /** Component map for the ECS-lite system. Keyed by componentType string. */
  private readonly components = new Map<string, Component>();

  // ── Animation tasks (legacy) ───────────────────────────────────
  protected animationTasks: EntityAnimationService[] = [];

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

  // ── Thin component delegates (lazy lookups, data lives in components) ──

  private _t?: TransformComponent | null;
  private _p?: PhysicsComponent | null;
  private _c?: CollisionComponent | null;
  private _n?: NetworkComponent | null;
  private _i?: InputComponent | null;
  private _a?: AnimationComponent | null;

  private get t(): TransformComponent | null {
    if (this._t === undefined) this._t = this.getComponent(TransformComponent);
    return this._t;
  }
  private get p(): PhysicsComponent | null {
    if (this._p === undefined) this._p = this.getComponent(PhysicsComponent);
    return this._p;
  }
  private get c(): CollisionComponent | null {
    if (this._c === undefined) this._c = this.getComponent(CollisionComponent);
    return this._c;
  }
  private get n(): NetworkComponent | null {
    if (this._n === undefined) this._n = this.getComponent(NetworkComponent);
    return this._n;
  }
  private get i(): InputComponent | null {
    if (this._i === undefined) this._i = this.getComponent(InputComponent);
    return this._i;
  }
  private get a(): AnimationComponent | null {
    if (this._a === undefined) this._a = this.getComponent(AnimationComponent);
    return this._a;
  }

  // ── Transform accessors ────────────────────────────────────────

  protected get x(): number { return this.t?.x ?? 0; }
  protected set x(v: number) { const t = this.t; if (t) t.x = v; }
  protected get y(): number { return this.t?.y ?? 0; }
  protected set y(v: number) { const t = this.t; if (t) t.y = v; }
  protected get width(): number { return this.t?.width ?? 0; }
  protected set width(v: number) { const t = this.t; if (t) t.width = v; }
  protected get height(): number { return this.t?.height ?? 0; }
  protected set height(v: number) { const t = this.t; if (t) t.height = v; }
  protected get angle(): number { return this.t?.angle ?? 0; }
  protected set angle(v: number) { const t = this.t; if (t) t.angle = v; }
  protected get scale(): number { return this.t?.scale ?? 1; }
  protected set scale(v: number) { const t = this.t; if (t) t.scale = v; }
  protected get skipInterpolation(): boolean { return this.t?.skipInterpolation ?? false; }
  protected set skipInterpolation(v: boolean) { const t = this.t; if (t) t.skipInterpolation = v; }
  public getX(): number { return this.t?.x ?? 0; }
  public setX(x: number): void { const t = this.t; if (t) t.x = x; }
  public getY(): number { return this.t?.y ?? 0; }
  public setY(y: number): void { const t = this.t; if (t) t.y = y; }
  public getWidth(): number { return this.t?.width ?? 0; }
  public setWidth(w: number): void { const t = this.t; if (t) t.width = w; }
  public getHeight(): number { return this.t?.height ?? 0; }
  public setHeight(h: number): void { const t = this.t; if (t) t.height = h; }
  public getAngle(): number { return this.t?.angle ?? 0; }
  public setAngle(a: number): void { const t = this.t; if (t) t.angle = a; }
  public getScale(): number { return this.t?.scale ?? 1; }
  public setScale(s: number): void { const t = this.t; if (t) t.scale = s; }
  public setSkipInterpolation(): void { const t = this.t; if (t) t.skipInterpolation = true; }
  public wasSkipInterpolationSet(): boolean { return this.t?.skipInterpolation ?? false; }
  public teleport(x: number, y: number, angle?: number): void {
    this.t?.teleport(x, y, angle);
    this.p?.resetVelocity();
  }

  // ── Physics delegates ─────────────────────────────────────────

  public get physics(): PhysicsComponent { return this.p!; }
  public getVX(): number { return this.p?.vx ?? 0; }
  public setVX(vx: number): void { const p = this.p; if (p) p.vx = vx; }
  public getVY(): number { return this.p?.vy ?? 0; }
  public setVY(vy: number): void { const p = this.p; if (p) p.vy = vy; }
  public getMass(): number { return this.p?.mass ?? 0; }
  public getBounciness(): number { return this.p?.bounciness ?? 1; }
  public setBounciness(b: number): void { const p = this.p; if (p) p.bounciness = b; }
  public isDynamic(): boolean { return this.p?.isDynamic ?? false; }
  public hasRigidBody(): boolean { return this.p?.rigidBody ?? false; }

  // ── Collision delegates ───────────────────────────────────────

  public isColliding(): boolean { return this.c?.isColliding() ?? false; }
  public isCollidingWithStatic(): boolean { return this.c?.isCollidingWithStatic() ?? false; }
  public getHitboxEntities(): HitboxEntity[] { return (this.c?.hitboxEntities as HitboxEntity[]) ?? []; }
  public setHitboxEntities(h: HitboxEntity[]): void { const c = this.c; if (c) c.hitboxEntities = h; }
  public getCollidingEntities(): BaseGameEntity[] { return (this.c?.collidingEntities as BaseGameEntity[]) ?? []; }
  public addCollidingEntity(e: BaseGameEntity): void { this.c?.collidingEntities.push(e); }
  public removeCollidingEntity(e: BaseGameEntity): void {
    const c = this.c; if (!c) return;
    c.collidingEntities = c.collidingEntities.filter(x => x !== e);
  }
  public isAvoidingCollision(): boolean { return this.c?.avoidingCollision ?? false; }
  public setAvoidingCollision(v: boolean): void { const c = this.c; if (c) c.avoidingCollision = v; }
  public addCollisionExclusion(ct: new (...args: never[]) => BaseGameEntity): void { this.c?.addCollisionExclusion(ct); }
  public removeCollisionExclusion(ct: new (...args: never[]) => BaseGameEntity): void { this.c?.removeCollisionExclusion(ct); }

  // ── Network delegates ─────────────────────────────────────────

  public getTypeId(): EntityType | null { return this.n?.typeId ?? null; }
  public setTypeId(id: EntityType): void { const n = this.n; if (n) n.typeId = id; }
  public getOwner(): Player | null { return this.n?.owner ?? null; }
  public setOwner(p: Player | null): void { const n = this.n; if (n) n.owner = p; }
  public isSyncable(): boolean { return this.n?.syncable ?? false; }
  public setSyncable(v: boolean): void { const n = this.n; if (n) n.syncable = v; }
  public isSyncableByHost(): boolean { return this.n?.syncableByHost ?? false; }
  public setSyncableByHost(v: boolean): void { const n = this.n; if (n) n.syncableByHost = v; }
  public mustSync(): boolean { return this.n?.mustSyncFlag ?? false; }
  public setSync(v: boolean): void { const n = this.n; if (n) n.mustSyncFlag = v; }
  public mustSyncReliably(): boolean { return this.n?.mustSyncReliablyFlag ?? false; }
  public setSyncReliably(v: boolean): void { const n = this.n; if (n) n.mustSyncReliablyFlag = v; }

  // ── Input delegates ───────────────────────────────────────────

  public isActive(): boolean { return this.i?.active ?? false; }
  public setActive(v: boolean): void { const i = this.i; if (i) i.active = v; }
  public isHovering(): boolean { return this.i?.hovering ?? false; }
  public isPressed(): boolean { return this.i?.pressed ?? false; }
  public handlePointerEvent(gp: GamePointerContract): void { this.i?.handlePointerEvent(gp); }

  // ── Animation delegates ───────────────────────────────────────

  public fadeIn(s: number): void { this.a?.fadeIn(s); }
  public fadeOut(s: number): void { this.a?.fadeOut(s); }
  public moveToX(nx: number, s: number): void { this.a?.moveToX(nx, s); }
  public moveToY(ny: number, s: number): void { this.a?.moveToY(ny, s); }
  public rotateTo(a: number, s: number): void { this.a?.rotateTo(a, s); }
  public scaleTo(s: number, dur: number): void { this.a?.scaleTo(s, dur); }

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
    const t = this.t; if (t) t.skipInterpolation = false;
  }

  public render(context: CanvasRenderingContext2D): void {
    this.components.forEach((component) => component.render?.(context));
  }
}
