import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import type { WebRTCPeer } from "../webrtc-peer.js";
import type { GameObject } from "./game-object.js";

export interface MultiplayerGameObject extends GameObject {
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
  sendSyncableData(
    webrtcPeer: WebRTCPeer,
    arrayBuffer: ArrayBuffer,
    periodicUpdate: boolean
  ): void;
  synchronize(arrayBuffer: ArrayBuffer): void;
}

export interface StaticMultiplayerGameObject {
  new (...args: never[]): MultiplayerGameObject;
  getTypeId(): ObjectType;
  deserialize(id: string, arrayBuffer: ArrayBuffer): MultiplayerGameObject;
}
