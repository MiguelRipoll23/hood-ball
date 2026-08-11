import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { CarScript } from "../scripts/car-script.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import type { Player } from "../../engine/interfaces/models/player-interface.js";
import type { EntityType } from "../../engine/enums/entity-type.js";
import { GamePlayer } from "../models/game-player.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { SCALE_FACTOR_FOR_ANGLES, SCALE_FACTOR_FOR_COORDINATES } from "../constants/webrtc-constants.js";

/**
 * Pure component container. All per-frame game logic, rendering, physics,
 * boost, smoke, and networking live in {@link CarScript}.
 */
export class CarEntity extends BaseGameEntity implements MultiplayerGameEntity {
  protected readonly carScript: CarScript;
  protected remote: boolean;

  constructor(x: number, y: number, angle: number, remote = false) {
    super();
    this.remote = remote;

    const transform = this.addComponent(new TransformComponent());
    const physics = this.addComponent(new PhysicsComponent());
    const collision = this.addComponent(new CollisionComponent());
    const network = this.addComponent(new NetworkComponent());

    this.carScript = new CarScript();
    this.addComponent(new ScriptComponent(this.carScript));
    this.carScript.resolveComponents(this, transform, physics, collision, network);

    this.carScript.init(x, y, angle, remote);
  }

  public override load(): void {
    this.carScript.createHitbox();
    this.carScript.loadCarImage(() => super.load());
  }

  public override reset(): void {
    this.carScript.reset();
    super.reset();
  }

  // ── NetworkComponent wrappers ─────────────────────────────────

  public getOwner(): Player | null { return this.getComponent(NetworkComponent)?.owner ?? null; }
  public setOwner(p: Player | null): void { const n = this.getComponent(NetworkComponent); if (n) n.owner = p; }
  public getTypeId(): EntityType | null { return this.getComponent(NetworkComponent)?.typeId ?? null; }
  public setTypeId(id: EntityType): void { const n = this.getComponent(NetworkComponent); if (n) n.typeId = id; }
  public isSyncable(): boolean { return this.getComponent(NetworkComponent)?.syncable ?? false; }
  public setSyncable(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.syncable = v; }
  public isSyncableByHost(): boolean { return this.getComponent(NetworkComponent)?.syncableByHost ?? false; }
  public setSyncableByHost(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.syncableByHost = v; }
  public mustSync(): boolean { return this.getComponent(NetworkComponent)?.mustSyncFlag ?? false; }
  public setSync(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncFlag = v; }
  public mustSyncReliably(): boolean { return this.getComponent(NetworkComponent)?.mustSyncReliablyFlag ?? false; }
  public setSyncReliably(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncReliablyFlag = v; }

  // ── Transform / Collision queries (used by external callers) ──

  public getX(): number { return this.carScript.transform.x; }
  public setX(x: number): void { this.carScript.transform.x = x; }
  public getY(): number { return this.carScript.transform.y; }
  public setY(y: number): void { this.carScript.transform.y = y; }
  public getWidth(): number { return this.carScript.transform.width; }
  public getHeight(): number { return this.carScript.transform.height; }
  public isColliding(): boolean { return this.carScript.collision.isColliding(); }
  public getCollidingEntities(): BaseGameEntity[] { return this.carScript.collision.collidingEntities as unknown as BaseGameEntity[]; }

  // ── Public API (delegates to CarScript) ───────────────────────

  public getPlayer(): GamePlayer | null { return this.getOwner() as GamePlayer | null; }
  public getBoost(): number { return this.carScript.getBoost(); }
  public setBoost(boost: number): void { this.carScript.setBoost(boost); }
  public isBoosting(): boolean { return this.carScript.boosting; }
  public getSpeed(): number { return this.carScript.speed; }
  public setSpeed(speed: number): void { this.carScript.speed = speed; }
  public getTopSpeed(): number { return this.carScript.getTopSpeed(); }
  public getBoostTopSpeedMultiplier(): number { return this.carScript.getBoostTopSpeedMultiplier(); }
  public setTopSpeed(topSpeed: number): void { this.carScript.setTopSpeed(topSpeed); }
  public setAcceleration(acceleration: number): void { this.carScript.setAcceleration(acceleration); }
  public getAcceleration(): number { return this.carScript.getAcceleration(); }
  public getHandling(): number { return this.carScript.HANDLING; }

  public demolish(respawnX: number, respawnY: number, delay: number): void {
    this.carScript.demolish(respawnX, respawnY, delay);
  }
  public isDemolished(): boolean { return this.carScript.isDemolished(); }
  public activateBoost(): void { this.carScript.activateBoost(); }
  public deactivateBoost(): void { this.carScript.deactivateBoost(); }
  public setWeatherFrictionMultiplier(multiplier: number): void {
    this.carScript.setWeatherFrictionMultiplier(multiplier);
  }
  public refillBoost(): void { this.carScript.refillBoost(); }
  public setCanvas(canvas: HTMLCanvasElement): void { this.carScript.canvas = canvas; }
  public getCanvas(): HTMLCanvasElement | null { return this.carScript.canvas; }
  public getMaxBoost(): number { return this.carScript.maxBoost; }
  public setAngle(v: number): void { this.carScript.setAngle(v); }
  public getAngle(): number { return this.carScript.getAngle(); }
  public updateHitbox(): void { this.carScript.updateHitbox(); }

  public teleport(x: number, y: number, angle?: number): void {
    this.carScript.teleport(x, y, angle);
  }

  public override serialize(): ArrayBuffer {
    const writer = BinaryWriter.build();
    this.carScript.serializeNetworkData(writer);
    return writer.toArrayBuffer();
  }

  public override getReplayState(): ArrayBuffer | null {
    const owner = this.getOwner();
    const playerName = owner?.getName() ?? "Unknown";
    let carType = 0;
    if (owner?.isNpc()) carType = 2;
    else if (this.remote) carType = 1;
    const writer = BinaryWriter.build();
    writer.variableLengthString(playerName);
    writer.unsignedInt8(carType);
    this.carScript.serializeNetworkData(writer);
    return writer.toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    const r = BinaryReader.fromArrayBuffer(arrayBuffer);
    const playerName = r.variableLengthString();
    const carType = r.unsignedInt8();
    const isNpc = carType === 2;
    const isRemote = carType === 1;
    this.remote = isRemote || isNpc;
    this.carScript.setRemote(this.remote);
    this.carScript.loadCarImage(() => {});
    const net = this.getComponent(NetworkComponent)!;
    if (!net.owner) {
      net.owner = new GamePlayer("replay-player", playerName, false, 0, 0, isNpc);
    } else if (net.owner.getName() !== playerName) {
      net.owner = new GamePlayer("replay-player", playerName, false, 0, 0, isNpc);
    }
    this.carScript.transform.x = r.unsignedInt16() / SCALE_FACTOR_FOR_COORDINATES;
    this.carScript.transform.y = r.unsignedInt16() / SCALE_FACTOR_FOR_COORDINATES;
    this.carScript.transform.angle = r.signedInt16() / SCALE_FACTOR_FOR_ANGLES;
    this.carScript.applyReplaySyncData(r);
    this.carScript.updateHitbox();
  }

}
