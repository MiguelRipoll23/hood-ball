import type { EntityType } from "../enums/entity-type.ts";
import type { Player } from "../interfaces/models/player-interface.ts";
import { BaseGameEntity } from "./base-game-entity.ts";
import type { MultiplayerGameEntity } from "../interfaces/entities/multiplayer-game-entity-interface.ts";

export class BaseMultiplayerGameEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity
{
  protected id: string | null = null;
  protected typeId: EntityType | null = null;
  protected syncableByHost: boolean = false;
  protected owner: Player | null = null;

  protected sync: boolean = false;
  protected syncReliably: boolean = false;

  public static getTypeId(): EntityType {
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

  public getTypeId(): EntityType | null {
    return this.typeId;
  }

  public setTypeId(entityTypeId: EntityType): void {
    this.typeId = entityTypeId;
  }

  public isSyncableByHost(): boolean {
    return this.syncableByHost;
  }

  public setSyncableByHost(syncableByHost: boolean): void {
    this.syncableByHost = syncableByHost;
  }

  public getOwner(): Player | null {
    return this.owner;
  }

  public setOwner(playerOwner: Player | null): void {
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
