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

  /** Called once when the component is attached to an entity. */
  init?(): void;

  /** Called each frame. Receives the delta time in milliseconds. */
  update?(deltaTimeStamp: DOMHighResTimeStamp): void;

  /** Called each frame for rendering. */
  render?(context: CanvasRenderingContext2D): void;
}
