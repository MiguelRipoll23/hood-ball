import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { MultiplayerGameObject } from "../interfaces/object/multiplayer-game-object.js";
import { SCALE_FACTOR_FOR_ANGLES } from "../constants/webrtc-constants.js";

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
    data: ArrayBuffer
  ): MultiplayerGameObject {
    const dataView = new DataView(data);
    const x = dataView.getUint16(0);
    const y = dataView.getUint16(2);
    const angle = dataView.getInt16(4) / SCALE_FACTOR_FOR_ANGLES;
    const speed = dataView.getFloat32(6);

    return new RemoteCarObject(syncableId, x, y, angle, speed);
  }

  public override synchronize(data: ArrayBuffer): void {
    const dataView = new DataView(data);

    this.x = dataView.getUint16(0);
    this.y = dataView.getUint16(2);
    this.angle = dataView.getInt16(4) / SCALE_FACTOR_FOR_ANGLES;
    this.speed = dataView.getFloat32(6);

    this.updateHitbox();
  }

  private setSyncableValues(syncableId: string) {
    this.id = syncableId;
    this.typeId = ObjectType.RemoteCar;
    this.syncableByHost = true;
  }
}
