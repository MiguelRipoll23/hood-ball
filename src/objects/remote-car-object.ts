import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import type { MultiplayerGameObject } from "../interfaces/object/multiplayer-game-object.js";
import {
  SCALE_FACTOR_FOR_ANGLES,
  SCALE_FACTOR_FOR_SPEED,
} from "../constants/webrtc-constants.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";

export class RemoteCarObject extends CarObject {
  constructor(
    syncableId: string,
    x: number,
    y: number,
    angle: number,
    speed: number
  ) {
    super(x, y, angle, true);
    this.speed = speed;
    this.setSyncableValues(syncableId);
  }

  public static override getTypeId(): ObjectType {
    return ObjectType.RemoteCar;
  }

  public static deserialize(
    syncableId: string,
    arrayBuffer: ArrayBuffer
  ): MultiplayerGameObject {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const x = binaryReader.unsignedInt16();
    const y = binaryReader.unsignedInt16();
    const angle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    const speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;

    return new RemoteCarObject(syncableId, x, y, angle, speed);
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    this.x = binaryReader.unsignedInt16();
    this.y = binaryReader.unsignedInt16();
    this.angle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    this.speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;

    this.updateHitbox();
  }

  private setSyncableValues(syncableId: string) {
    this.id = syncableId;
    this.typeId = ObjectType.RemoteCar;
    this.syncableByHost = true;
  }
}
