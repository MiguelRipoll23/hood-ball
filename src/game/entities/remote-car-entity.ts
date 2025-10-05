import { EntityType } from "../enums/entity-type.js";
import { CarEntity } from "./car-entity.js";
import type { MultiplayerGameEntity } from "../../core/interfaces/entities/multiplayer-game-entity.js";
import {
  SCALE_FACTOR_FOR_ANGLES,
  SCALE_FACTOR_FOR_SPEED,
  SCALE_FACTOR_FOR_COORDINATES,
} from "../constants/webrtc-constants.js";
import { BinaryReader } from "../../core/utils/binary-reader-utils.js";
import { MathUtils } from "../../core/utils/math-utils.js";
import { TELEPORT_SKIP_FRAMES } from "../constants/entity-constants.js";

export class RemoteCarEntity extends CarEntity {
  private teleportFrameCount = 0; // Number of frames to skip interpolation after teleport

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

    const scaledX = binaryReader.unsignedInt16();
    const scaledY = binaryReader.unsignedInt16();
    const x = scaledX / SCALE_FACTOR_FOR_COORDINATES;
    const y = scaledY / SCALE_FACTOR_FOR_COORDINATES;
    const angle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    const speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    const boosting = binaryReader.boolean();
    const boost = binaryReader.unsignedInt8();

    return new RemoteCarEntity(syncableId, x, y, angle, speed, boosting, boost);
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);

    const scaledX = binaryReader.unsignedInt16();
    const scaledY = binaryReader.unsignedInt16();
    const newX = scaledX / SCALE_FACTOR_FOR_COORDINATES;
    const newY = scaledY / SCALE_FACTOR_FOR_COORDINATES;
    const newAngle = binaryReader.signedInt16() / SCALE_FACTOR_FOR_ANGLES;

    // Check if we should skip interpolation (either due to setSkipInterpolation or teleport)
    const shouldSkipInterpolation =
      this.skipInterpolation || this.teleportFrameCount > 0;

    if (shouldSkipInterpolation) {
      this.x = newX;
      this.y = newY;
      this.angle = newAngle;
      this.skipInterpolation = false;

      // Decrement teleport frame count
      if (this.teleportFrameCount > 0) {
        this.teleportFrameCount--;
      }
    } else {
      // Smooth the remote movement to reduce jitter
      this.x = MathUtils.lerp(this.x, newX, 0.5);
      this.y = MathUtils.lerp(this.y, newY, 0.5);
      this.angle = MathUtils.lerp(this.angle, newAngle, 0.5);
    }

    this.speed = binaryReader.signedInt16() / SCALE_FACTOR_FOR_SPEED;
    this.boosting = binaryReader.boolean();
    this.boost = binaryReader.unsignedInt8();

    this.updateHitbox();
  }

  public override teleport(x: number, y: number, angle?: number): void {
    // Call parent teleport method
    super.teleport(x, y, angle);

    // Set frame count to skip interpolation for multiple frames
    this.teleportFrameCount = TELEPORT_SKIP_FRAMES;
  }

  private setSyncableValues(syncableId: string) {
    this.id = syncableId;
    this.typeId = EntityType.RemoteCar;
    this.syncableByHost = true;
  }
}
