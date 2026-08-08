import type { BaseGameEntity } from "../entities/base-game-entity.js";

/**
 * Base interface for all entity components.
 *
 * Components are composable behaviors that can be attached to entities,
 * providing an alternative to deep inheritance hierarchies.
 *
 * Usage:
 *   const transform = entity.addComponent(new TransformComponent());
 *   entity.getComponent(TransformComponent)?.setPosition(100, 200);
 */
export interface Component {
  /** Unique type identifier for the component (set to constructor name by convention). */
  readonly componentType: string;

  /** Reference to the owning entity. Set automatically by addComponent(). */
  entity?: BaseGameEntity;

  /** Called once when the component is attached to an entity. */
  init?(): void;

  /** Called each frame. Receives the delta time in milliseconds. */
  update?(deltaTimeStamp: DOMHighResTimeStamp): void;

  /** Called each frame for rendering debug overlays, gizmos, and visualizations. */
  render?(context: CanvasRenderingContext2D): void;
}
