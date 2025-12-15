import type { Player } from "../interfaces/models/player-interface.js";
import { BaseGameEntity } from "./base-game-entity.js";
import type { MultiplayerGameEntity } from "../interfaces/entities/multiplayer-game-entity-interface.js";

export class BaseMultiplayerGameEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity
{
  protected syncable: boolean = false;
  protected syncableByHost: boolean = false;
  protected owner: Player | null = null;

  protected sync: boolean = false;
  protected syncReliably: boolean = false;

  public static deserialize(
    _id: string,
    _arrayBuffer: ArrayBuffer
  ): MultiplayerGameEntity {
    throw new Error("Method not implemented.");
  }

  /**
   * Returns the multiplayer ID if set, otherwise falls back to the auto-generated ID.
   */
  public override getId(): string {
    return this.id;
  }

  public override setId(id: string): void {
    this.id = id;
  }

  public isSyncable(): boolean {
    return this.syncable;
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
