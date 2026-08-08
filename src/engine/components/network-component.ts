import type { Component } from "./component.js";
import type { BaseGameEntity } from "../entities/base-game-entity.js";
import type { EntityType } from "../enums/entity-type.js";
import type { Player } from "../interfaces/models/player-interface.js";
import type { DebugSettings } from "../models/debug-settings.js";
import { TransformComponent } from "./transform-component.js";

/**
 * Holds multiplayer networking state for an entity: owner, type registry ID,
 * and sync flags. Previously part of BaseMultiplayerGameEntity.
 *
 * Also renders a debug hexagon overlay on syncable entities when
 * the "show syncable entities" debug toggle is on.
 */
export class NetworkComponent implements Component {
  public readonly componentType = "NetworkComponent";
  public networkId: string | null = null;
  public typeId: EntityType | null = null;
  public syncable = false;
  public syncableByHost = false;
  public owner: Player | null = null;

  /** Flag: request unreliable-unordered sync next frame. */
  public mustSyncFlag = false;

  /** Flag: request reliable-ordered sync next frame. */
  public mustSyncReliablyFlag = false;

  /** Reference to the owning entity. Set automatically by addComponent(). */
  public entity?: BaseGameEntity;

  /** Populated by BaseGameEntity.setDebugSettings() when debug toggles change. */
  public debugSettings: DebugSettings | null = null;

  // ── Hexagon rendering constants ────────────────────────────────

  private static readonly HEXAGON_SIDES = 6;
  private static readonly HEXAGON_RADIUS = 25;
  private static readonly HEXAGON_COLOR = "rgba(255, 20, 147, 0.85)";

  public getId(): string {
    return this.networkId ?? "";
  }

  public render(context: CanvasRenderingContext2D): void {
    if (
      !this.debugSettings?.showSyncableEntitiesOverlay() ||
      !this.syncable
    ) return;

    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return;

    const cx = transform.x;
    const cy = transform.y;

    context.save();
    context.strokeStyle = NetworkComponent.HEXAGON_COLOR;
    context.lineWidth = 1.5;
    context.beginPath();

    const r = NetworkComponent.HEXAGON_RADIUS;
    for (let i = 0; i < NetworkComponent.HEXAGON_SIDES; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.stroke();
    context.restore();
  }
}
