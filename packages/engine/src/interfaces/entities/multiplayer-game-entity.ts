import type { GameEntity } from "../../models/game-entity.js";

export interface MultiplayerGameEntity<
  TTypeId = unknown,
  TOwner = unknown
> extends GameEntity {
  getId(): string | null;
  getTypeId(): TTypeId | null;
  getOwner(): TOwner | null;
  setOwner(player: TOwner | null): void;
  isSyncableByHost(): boolean;
  mustSync(): boolean;
  setSync(sync: boolean): void;
  mustSyncReliably(): boolean;
  setSyncReliably(syncReliably: boolean): void;
  serialize(): ArrayBuffer;
  synchronize(arrayBuffer: ArrayBuffer): void;
}

export interface MultiplayerGameEntityConstructor<
  TEntity extends MultiplayerGameEntity,
  TArgs extends unknown[] = never[]
> {
  new (...args: TArgs): TEntity;
}

export interface StaticMultiplayerGameEntity<
  TTypeId = unknown,
  TOwner = unknown,
  TEntity extends MultiplayerGameEntity<TTypeId, TOwner> = MultiplayerGameEntity<
    TTypeId,
    TOwner
  >,
  TArgs extends unknown[] = never[]
> extends MultiplayerGameEntityConstructor<TEntity, TArgs> {
  getTypeId(): TTypeId;
  deserialize(id: string, arrayBuffer: ArrayBuffer): TEntity;
}
