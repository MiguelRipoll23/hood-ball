import { GamePlayer } from "../../../game/models/game-player.js";
import { EntityType } from "../../../game/enums/entity-type.js";
import type { GameEntity } from "../../models/game-entity.js";

export interface MultiplayerGameEntity extends GameEntity {
  getId(): string | null;
  getTypeId(): EntityType | null;
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
  getTypeId(): EntityType;
  deserialize(id: string, arrayBuffer: ArrayBuffer): MultiplayerGameEntity;
}
