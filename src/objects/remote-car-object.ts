import { ObjectType } from "../enums/object-type.js";
import { CarObject } from "./car-object.js";
import { MultiplayerGameObject } from "../interfaces/object/multiplayer-game-object.js";

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
    const x = dataView.getFloat32(0);
    const y = dataView.getFloat32(2);
    const angle = dataView.getFloat32(4);
    const speed = dataView.getFloat32(6);

    return new RemoteCarObject(syncableId, x, y, angle, speed);
  }

  public override synchronize(data: ArrayBuffer): void {
    const dataView = new DataView(data);

    this.x = dataView.getFloat32(0);
    this.y = dataView.getFloat32(2);
    this.angle = dataView.getFloat32(4);
    this.speed = dataView.getFloat32(6);

    this.updateHitbox();
  }

  private setSyncableValues(syncableId: string) {
    this.id = syncableId;
    this.typeId = ObjectType.RemoteCar;
    this.syncableByHost = true;
  }
}
