import type { Component } from "./component.js";

/**
 * Lifecycle hooks that a script behaviour can implement.
 * Mirrors common game-engine patterns (Unity MonoBehaviour, Godot _Process, etc.).
 */
export interface ScriptLifecycle {
  /** Called once when the script is first attached and the entity is loaded. */
  awake?(): void;

  /** Called once before the first update, after all components are initialized. */
  start?(): void;

  /** Called every frame with delta time in milliseconds. */
  update?(deltaTimeStamp: DOMHighResTimeStamp): void;

  /** Called every frame for custom rendering after entity render. */
  render?(context: CanvasRenderingContext2D): void;

  /** Called when the entity is removed / destroyed. */
  destroy?(): void;
}

/**
 * A component that holds a script behaviour with standard lifecycle hooks.
 *
 * Usage:
 *   entity.addComponent(new ScriptComponent({
 *     awake() { ... },
 *     update(dt) { ... },
 *     destroy() { ... },
 *   }));
 */
export class ScriptComponent implements Component {
  static readonly componentType = "ScriptComponent";

  /** Generate a unique component type key for a given priority slot. */
  static componentTypeForPriority(priority: number): string {
    return `ScriptComponent:${priority}`;
  }

  public readonly componentType: string;

  public readonly lifecycle: ScriptLifecycle;

  /**
   * Execution priority. Lower values run earlier in the frame.
   * Default 0. Use negative values for "pre-update" scripts
   * that must execute before core game logic (e.g. input, AI).
   */
  public readonly updatePriority: number;

  private _started = false;
  private _awakeCalled = false;

  constructor(lifecycle: ScriptLifecycle, updatePriority = 0) {
    this.lifecycle = lifecycle;
    this.updatePriority = updatePriority;
    this.componentType = ScriptComponent.componentTypeForPriority(updatePriority);
  }

  /** Called automatically by BaseGameEntity after all components are attached. */
  public init(): void {
    // awake is called once when component is first active
    if (!this._awakeCalled) {
      this._awakeCalled = true;
      this.lifecycle.awake?.();
    }
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (!this._started) {
      this._started = true;
      this.lifecycle.start?.();
    }
    this.lifecycle.update?.(deltaTimeStamp);
  }

  public render(context: CanvasRenderingContext2D): void {
    this.lifecycle.render?.(context);
  }

  /** Manually trigger destroy. Also called by BaseGameEntity when entity is removed. */
  public destroy(): void {
    this.lifecycle.destroy?.();
  }
}
