import type { Player } from "../models/player-interface.ts";
import { EntityType } from "../../enums/entity-type.ts";
import type { GameEntity } from "../../models/game-entity.ts";

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
  serialize(): ArrayBuffer;
  synchronize(arrayBuffer: ArrayBuffer): void;
}

export interface StaticMultiplayerGameEntity {
  new (...args: never[]): MultiplayerGameEntity;
  getTypeId(): EntityType;
  deserialize(id: string, arrayBuffer: ArrayBuffer): MultiplayerGameEntity;
}
