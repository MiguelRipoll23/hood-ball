import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { CarEntity } from "./car-entity.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import {
  SCALE_FACTOR_FOR_ANGLES, SCALE_FACTOR_FOR_SPEED, SCALE_FACTOR_FOR_COORDINATES,
} from "../constants/webrtc-constants.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { TELEPORT_SKIP_FRAMES } from "../constants/entity-constants.js";

/**
 * Thin container. Network synchronization delegated to
 * {@link CarScript.synchronizeNetworkState}.
 */
export class RemoteCarEntity extends CarEntity {
  private teleportFrameCount = 0;

  constructor(
    syncableId: string,
    x: number, y: number, angle: number,
    speed: number, boosting: boolean, boost: number,
  ) {
    super(x, y, angle, true);
    this.carScript.speed = speed;
    this.carScript.boosting = boosting;
    this.carScript.setBoost(boost);
    this.setSyncableValues(syncableId);
  }

  public static getTypeId(): EntityRegistryType {
    return EntityRegistryType.RemoteCar;
  }

  public static deserialize(
    syncableId: string, arrayBuffer: ArrayBuffer,
  ): MultiplayerGameEntity {
    const r = BinaryReader.fromArrayBuffer(arrayBuffer);
    const x = r.unsignedInt16() / SCALE_FACTOR_FOR_COORDINATES;
    const y = r.unsignedInt16() / SCALE_FACTOR_FOR_COORDINATES;
    const angle = r.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    const speed = r.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    const boosting = r.boolean();
    const boost = r.unsignedInt8();
    return new RemoteCarEntity(syncableId, x, y, angle, speed, boosting, boost);
  }

  public synchronize(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.teleportFrameCount = this.carScript.synchronizeNetworkState(
      reader, this.teleportFrameCount,
    );
  }

  public override teleport(x: number, y: number, angle?: number): void {
    this.carScript.teleport(x, y, angle);
    this.teleportFrameCount = TELEPORT_SKIP_FRAMES;
  }

  private setSyncableValues(syncableId: string): void {
    this.setSyncable(true);
    this.setId(syncableId);
    this.setTypeId(EntityRegistryType.RemoteCar);
    this.setSyncableByHost(true);
  }
}
