import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import { WebRTCPeer } from "../../interfaces/webrtc-peer.js";
import { MultiplayerGameObject } from "../../interfaces/object/multiplayer-game-object.js";
import { BaseGameObject } from "./base-game-object.js";

export class BaseMultiplayerGameObject
  extends BaseGameObject
  implements MultiplayerGameObject
{
  protected id: string | null = null;
  protected displayId: string | null = null;
  protected typeId: ObjectType | null = null;
  protected syncableByHost: boolean = false;
  protected owner: GamePlayer | null = null;

  protected sync: boolean = false;
  protected syncReliably: boolean = false;

  public static getTypeId(): ObjectType {
    throw new Error("Method not implemented.");
  }

  public static deserialize(
    _id: string,
    _data: ArrayBuffer
  ): MultiplayerGameObject {
    throw new Error("Method not implemented.");
  }

  public getId(): string | null {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id.replace(/-/g, "");
    this.displayId = id;
  }

  public getDisplayId(): string | null {
    return this.displayId;
  }

  public getTypeId(): ObjectType | null {
    return this.typeId;
  }

  public setTypeId(objectTypeId: ObjectType): void {
    this.typeId = objectTypeId;
  }

  public isSyncableByHost(): boolean {
    return this.syncableByHost;
  }

  public setSyncableByHost(syncableByHost: boolean): void {
    this.syncableByHost = syncableByHost;
  }

  public getOwner(): GamePlayer | null {
    return this.owner;
  }

  public setOwner(playerOwner: GamePlayer | null): void {
    this.owner = playerOwner;
  }

  public mustSync(): boolean {
    return this.sync;
  }

  public setSync(sync: boolean): void {
    if (this.sync && !sync) {
      console.log("sync state changed for object from true to false", this);
    } else if (!this.sync && sync) {
      console.log("sync state changed for object from false to true", this);
    }

    this.sync = sync;

    if (sync) {
      console.log("Forced ordered unreliable sync for object", this);
    }
  }

  public mustSyncReliably(): boolean {
    return this.syncReliably;
  }

  public setSyncReliably(syncReliably: boolean): void {
    this.syncReliably = syncReliably;

    if (syncReliably) {
      console.log("Forced ordered reliable sync for object", this);
    }
  }

  public reset(): void {
    this.setSyncReliably(true);
  }

  public serialize(): ArrayBuffer {
    throw new Error("Method not implemented.");
  }

  public sendSyncableData(
    _webrtcPeer: WebRTCPeer,
    _data: ArrayBuffer,
    _periodicUpdate: boolean
  ): void {
    throw new Error("Method not implemented.");
  }

  public synchronize(_data: ArrayBuffer): void {
    throw new Error("Method not implemented.");
  }
}
