import type { Component } from "./component.js";
import type { BaseGameEntity } from "../entities/base-game-entity.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { TransformComponent } from "./transform-component.js";

/**
 * Holds physics state for dynamic entities: velocity, mass, and collision
 * response properties. Previously part of BaseDynamicCollidingGameEntity.
 *
 * Also renders debug gizmos (center circle + direction arrow) when
 * debug mode is enabled and gizmos are visible.
 */
export class PhysicsComponent implements Component {
  static readonly componentType = "PhysicsComponent";
  public readonly componentType = PhysicsComponent.componentType;
  public vx = 0;
  public vy = 0;
  public mass = 0;
  public bounciness = 1;
  public rigidBody = true;
  public isDynamic = false;

  /** Reference to the owning entity. Set automatically by addComponent(). */
  public entity?: BaseGameEntity;

  /** Populated by BaseGameEntity.setDebugSettings() when debug toggles change. */
  public debugSettings: DebugSettings | null = null;

  // ── Gizmo rendering constants ──────────────────────────────────

  private static readonly LINE_LENGTH = 50;
  private static readonly ARROW_SIZE = 15;
  private static readonly CENTER_CIRCLE_RADIUS = 7;
  private static readonly CENTER_FILL_STYLE = "rgba(255, 255, 0, 0.6)";
  private static readonly CENTER_STROKE_STYLE = "yellow";
  private static readonly DIRECTION_STROKE_STYLE = "orange";
  private static readonly ARROW_ANGLE_OFFSET = Math.PI / 7;
  private static readonly LINE_WIDTH = 3;
  private static readonly CENTER_LINE_WIDTH = 2;

  public resetVelocity(): void {
    this.vx = 0;
    this.vy = 0;
  }

  public render(context: CanvasRenderingContext2D): void {
    if (
      !this.debugSettings?.isDebugging() ||
      !this.debugSettings?.areGizmosVisible()
    ) return;

    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return;

    const { x, y, angle } = transform;

    context.save();

    // Center circle
    context.fillStyle = PhysicsComponent.CENTER_FILL_STYLE;
    context.strokeStyle = PhysicsComponent.CENTER_STROKE_STYLE;
    context.lineWidth = PhysicsComponent.CENTER_LINE_WIDTH;
    context.beginPath();
    context.arc(
      x, y,
      PhysicsComponent.CENTER_CIRCLE_RADIUS,
      0, 2 * Math.PI,
    );
    context.fill();
    context.stroke();

    // Direction arrow
    const lineLength = PhysicsComponent.LINE_LENGTH;
    const endX = x + Math.cos(angle) * lineLength;
    const endY = y + Math.sin(angle) * lineLength;

    context.strokeStyle = PhysicsComponent.DIRECTION_STROKE_STYLE;
    context.lineWidth = PhysicsComponent.LINE_WIDTH;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    context.stroke();

    // Arrowhead
    const arrowSize = PhysicsComponent.ARROW_SIZE;
    context.fillStyle = PhysicsComponent.DIRECTION_STROKE_STYLE;
    context.beginPath();
    const a1 = angle + PhysicsComponent.ARROW_ANGLE_OFFSET;
    const a2 = angle - PhysicsComponent.ARROW_ANGLE_OFFSET;
    context.moveTo(endX, endY);
    context.lineTo(endX - arrowSize * Math.cos(a1), endY - arrowSize * Math.sin(a1));
    context.lineTo(endX - arrowSize * Math.cos(a2), endY - arrowSize * Math.sin(a2));
    context.closePath();
    context.fill();

    context.restore();
  }
}
