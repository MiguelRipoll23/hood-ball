import type { Player } from "../models/player-interface.js";
import { EntityType } from "../../enums/entity-type.js";
import type { GameEntity } from "../../models/game-entity.js";

export interface MultiplayerGameEntity extends GameEntity {
  getId(): string | null;
  getTypeId(): EntityType | null;
  getOwner(): Player | null;
  setOwner(player: Player | null): void;
  isSyncableByHost(): boolean;
  mustSync(): boolean;
  setSync(sync: boolean): void;
  mustSyncReliably(): boolean;
  setSyncReliably(syncReliably: boolean): void;
  // Note: serialize() and synchronize() are inherited from GameEntity
  // Multiplayer entities must override serialize() to return ArrayBuffer (not null)
  serialize(): ArrayBuffer;
}

export interface StaticMultiplayerGameEntity {
  new (...args: never[]): MultiplayerGameEntity;
  getTypeId(): EntityType;
  deserialize(id: string, arrayBuffer: ArrayBuffer): MultiplayerGameEntity;
}
