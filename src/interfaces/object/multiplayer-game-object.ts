import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import { WebRTCPeer } from "../webrtc-peer.js";
import { GameObject } from "./game-object.js";

export interface MultiplayerGameObject extends GameObject {
  getId(): string | null;
  getTypeId(): ObjectType | null;
  getOwner(): GamePlayer | null;
  setOwner(player: GamePlayer | null): void;
  isSyncableByHost(): boolean;
  mustSync(): boolean;
  setSync(sync: boolean): void;
  serialize(): ArrayBuffer;
  sendSyncableData(
    webrtcPeer: WebRTCPeer,
    data: ArrayBuffer,
    periodicUpdate: boolean
  ): void;
  synchronize(data: ArrayBuffer): void;
}

export interface StaticMultiplayerGameObject {
  new (...args: never[]): MultiplayerGameObject;
  getTypeId(): ObjectType;
  deserialize(id: string, data: ArrayBuffer): MultiplayerGameObject;
}
