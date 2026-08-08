import type { Component } from "./component.js";
import type { EntityType } from "../enums/entity-type.js";
import type { Player } from "../interfaces/models/player-interface.js";

/**
 * Holds multiplayer networking state for an entity: owner, type registry ID,
 * and sync flags. Previously part of BaseMultiplayerGameEntity.
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

  public getId(): string {
    return this.networkId ?? "";
  }
}
