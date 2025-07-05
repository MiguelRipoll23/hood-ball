import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import type { GameEntity } from "./game-entity.js";

export interface MultiplayerGameEntity extends GameEntity {
  getId(): string | null;
  getTypeId(): ObjectType | null;
  getOwner(): GamePlayer | null;
  setOwner(player: GamePlayer | null): void;
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
  getTypeId(): ObjectType;
  deserialize(id: string, arrayBuffer: ArrayBuffer): MultiplayerGameEntity;
}
