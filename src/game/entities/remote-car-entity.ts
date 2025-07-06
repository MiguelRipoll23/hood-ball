import { EntityType } from "../enums/entity-type.js";
import { CarEntity } from "./car-entity.js";
import type { MultiplayerGameEntity } from "../../core/interfaces/entities/multiplayer-game-entity.js";
import {
  SCALE_FACTOR_FOR_ANGLES,
  SCALE_FACTOR_FOR_SPEED,
} from "../constants/webrtc-constants.js";
import { BinaryReader } from "../../core/utils/binary-reader-utils.js";

export class RemoteCarEntity extends CarEntity {
  constructor(
    syncableId: string,
    x: number,
    y: number,
    angle: number,
    speed: number,
    boosting: boolean,
    boost: number
  ) {
    super(x, y, angle, true);
    this.speed = speed;
    this.boosting = boosting;
    this.boost = boost;
    this.setSyncableValues(syncableId);
  }

  public static override getTypeId(): EntityType {
    return EntityType.RemoteCar;
  }

  public static deserialize(
    syncableId: string,
    arrayBuffer: ArrayBuffer
  ): MultiplayerGameEntity {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const x = binaryReader.unsignedInt16();
    const y = binaryReader.unsignedInt16();
    const angle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    const speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    const boosting = binaryReader.unsignedInt8() === 1;
    const boost = binaryReader.unsignedInt8();

    return new RemoteCarEntity(
      syncableId,
      x,
      y,
      angle,
      speed,
      boosting,
      boost
    );
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    this.x = binaryReader.unsignedInt16();
    this.y = binaryReader.unsignedInt16();
    this.angle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    this.speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    this.boosting = binaryReader.unsignedInt8() === 1;
    this.boost = binaryReader.unsignedInt8();

    this.updateHitbox();
  }

  private setSyncableValues(syncableId: string) {
    this.id = syncableId;
    this.typeId = EntityType.RemoteCar;
    this.syncableByHost = true;
  }
}
