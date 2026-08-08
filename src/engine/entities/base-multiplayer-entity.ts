import type { EntityType } from "../enums/entity-type.js";
import type { Player } from "../interfaces/models/player-interface.js";
import { BaseGameEntity } from "./base-game-entity.js";
import type { MultiplayerGameEntity } from "../interfaces/entities/multiplayer-game-entity-interface.js";
import { NetworkComponent } from "../components/network-component.js";
import { EngineLogger } from "../services/engine-logger.js";

export class BaseMultiplayerGameEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity
{
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected id: string | null = null;
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected typeId: EntityType | null = null;
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected syncable: boolean = false;
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected syncableByHost: boolean = false;
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected owner: Player | null = null;

  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected sync: boolean = false;
  /** @deprecated Use `getComponent(NetworkComponent)` for new code. */
  protected syncReliably: boolean = false;

  /** Backing NetworkComponent – all network state is stored here. */
  protected readonly network: NetworkComponent;

  constructor() {
    super();
    this.network = this.addComponent(new NetworkComponent());
  }

  public static getTypeId(): EntityType {
    throw new Error("Method not implemented.");
  }

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
    return this.network.networkId ?? this.entityId;
  }

  public override setId(id: string): void {
    this.network.networkId = id;
    this.id = id; // keep deprecated field in sync
  }

  public getTypeId(): EntityType | null {
    return this.network.typeId;
  }

  public setTypeId(entityTypeId: EntityType): void {
    this.network.typeId = entityTypeId;
    this.typeId = entityTypeId; // keep deprecated field in sync
  }

  public isSyncable(): boolean {
    return this.network.syncable;
  }

  public isSyncableByHost(): boolean {
    return this.network.syncableByHost;
  }

  public setSyncableByHost(syncableByHost: boolean): void {
    this.network.syncableByHost = syncableByHost;
    this.syncableByHost = syncableByHost; // keep deprecated field in sync
  }

  public getOwner(): Player | null {
    return this.network.owner;
  }

  public setOwner(playerOwner: Player | null): void {
    this.network.owner = playerOwner;
    this.owner = playerOwner; // keep deprecated field in sync
  }

  public mustSync(): boolean {
    return this.network.mustSyncFlag;
  }

  public setSync(sync: boolean): void {
    this.network.mustSyncFlag = sync;
    this.sync = sync; // keep deprecated field in sync

    if (sync) {
      EngineLogger.info("MultiplayerEntity", "Forced ordered unreliable sync for entity", this);
    }
  }

  public mustSyncReliably(): boolean {
    return this.network.mustSyncReliablyFlag;
  }

  public setSyncReliably(syncReliably: boolean): void {
    this.network.mustSyncReliablyFlag = syncReliably;
    this.syncReliably = syncReliably; // keep deprecated field in sync

    if (syncReliably) {
      EngineLogger.info("MultiplayerEntity", "Forced ordered reliable sync for entity", this);
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
