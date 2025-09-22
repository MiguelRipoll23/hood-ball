import { BaseGameEntity } from "@engine/entities/base-game-entity.js";
import type { MultiplayerGameEntity } from "@engine/interfaces/entities/multiplayer-game-entity.js";

export class BaseMultiplayerGameEntity<
  TTypeId = unknown,
  TOwner = unknown
> extends BaseGameEntity implements MultiplayerGameEntity<TTypeId, TOwner> {
  protected id: string | null = null;
  protected typeId: TTypeId | null = null;
  protected syncableByHost = false;
  protected owner: TOwner | null = null;

  protected sync = false;
  protected syncReliably = false;

  public static getTypeId(): unknown {
    throw new Error("Method not implemented.");
  }

  public static deserialize(
    _id: string,
    _arrayBuffer: ArrayBuffer
  ): MultiplayerGameEntity {
    throw new Error("Method not implemented.");
  }

  public getId(): string | null {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
  }

  public getTypeId(): TTypeId | null {
    return this.typeId;
  }

  public setTypeId(entityTypeId: TTypeId): void {
    this.typeId = entityTypeId;
  }

  public isSyncableByHost(): boolean {
    return this.syncableByHost;
  }

  public setSyncableByHost(syncableByHost: boolean): void {
    this.syncableByHost = syncableByHost;
  }

  public getOwner(): TOwner | null {
    return this.owner;
  }

  public setOwner(playerOwner: TOwner | null): void {
    this.owner = playerOwner;
  }

  public mustSync(): boolean {
    return this.sync;
  }

  public setSync(sync: boolean): void {
    this.sync = sync;

    if (sync) {
      console.log("Forced ordered unreliable sync for entity", this);
    }
  }

  public mustSyncReliably(): boolean {
    return this.syncReliably;
  }

  public setSyncReliably(syncReliably: boolean): void {
    this.syncReliably = syncReliably;

    if (syncReliably) {
      console.log("Forced ordered reliable sync for entity", this);
    }
  }

  public reset(): void {
    this.setSyncReliably(true);
  }

  public serialize(): ArrayBuffer {
    throw new Error("Method not implemented.");
  }

  public synchronize(_arrayBuffer: ArrayBuffer): void {
    throw new Error("Method not implemented.");
  }
}
