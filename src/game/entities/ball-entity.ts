import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BallScript } from "../scripts/ball-script.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import type { EntityType } from "../../engine/enums/entity-type.js";
import type { Player } from "../../engine/interfaces/models/player-interface.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { GamePlayer } from "../models/game-player.js";
import { container } from "../../engine/services/di-container.js";
import { GameState } from "../../engine/models/game-state.js";
import { BALL_NETWORK_ID } from "../constants/entity-constants.js";

/**
 * Pure component container for the ball. All per-frame game logic, physics,
 * collisions, networking, and rendering live in {@link BallScript} — the same
 * ECS pattern used by {@link CarEntity}/{@link CarScript}.
 */
export class BallEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity
{
  protected readonly ballScript: BallScript;

  constructor(
    x: number,
    y: number,
    private readonly canvas: HTMLCanvasElement
  ) {
    super();
    const transform = this.addComponent(new TransformComponent());
    const physics = this.addComponent(new PhysicsComponent());
    const collision = this.addComponent(new CollisionComponent());
    this.addComponent(new NetworkComponent());

    this.ballScript = new BallScript();
    this.addComponent(new ScriptComponent(this.ballScript));
    this.ballScript.resolveComponents(this, transform, physics, collision);
    this.ballScript.canvas = canvas;

    this.ballScript.init(x, y);
    this.setSyncableValues();
  }

  public static getTypeId(): EntityRegistryType {
    return EntityRegistryType.Ball;
  }

  public static deserialize(
    id: string,
    arrayBuffer: ArrayBuffer
  ): MultiplayerGameEntity {
    // The main ball is pre-created by WorldScene; this path only triggers for
    // unsupported dynamic ball creation (e.g. future multi-ball mode). Resolve
    // the canvas via DI since statics have no scene context.
    const canvas = container.get(GameState).getCanvas();
    const ball = new BallEntity(0, 0, canvas);
    ball.setId(id);
    ball.synchronize(arrayBuffer);
    return ball;
  }

  public override load(): void {
    this.ballScript.createHitbox();
    super.load();
  }

  public override reset(): void {
    // Pass the FULL canvas dimensions: BallScript.reset() halves them to
    // compute the center. Passing width/2 here would double-halve and leave
    // the ball at (width/4, height/4) instead of center.
    this.ballScript.reset(this.canvas.width, this.canvas.height);
    // Force an immediate reliable broadcast of the reset position so all
    // peers snap to center instead of holding a stale position during the
    // countdown (mustSync() is false once velocity is zeroed, so the
    // periodic 500ms sync alone would leave remote balls off-center).
    // Only the host broadcasts the ball — on non-hosts the flag would stick
    // because the orchestrator skips host-owned entities without clearing it.
    if (this.getComponent(NetworkComponent)?.owner === container.get(GamePlayer)) {
      const n = this.getComponent(NetworkComponent);
      if (n) n.mustSyncReliablyFlag = true;
    }
    super.reset();
  }

  public setCenterPosition(): void {
    this.ballScript.setCenterPosition(this.canvas.width, this.canvas.height);
  }

  public teleport(x: number, y: number, angle?: number): void {
    this.ballScript.teleport(x, y, angle);
  }

  // ── MultiplayerGameEntity (thin wrappers over NetworkComponent) ──

  public getTypeId(): EntityType | null { return this.getComponent(NetworkComponent)?.typeId ?? null; }
  public setTypeId(id: EntityType): void { const n = this.getComponent(NetworkComponent); if (n) n.typeId = id; }
  public getOwner(): Player | null { return this.getComponent(NetworkComponent)?.owner ?? null; }
  public setOwner(p: Player | null): void { const n = this.getComponent(NetworkComponent); if (n) n.owner = p; }
  public isSyncable(): boolean { return this.getComponent(NetworkComponent)?.syncable ?? false; }
  public setSyncable(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.syncable = v; }
  public isSyncableByHost(): boolean { return this.getComponent(NetworkComponent)?.syncableByHost ?? false; }
  public setSyncableByHost(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.syncableByHost = v; }
  public mustSync(): boolean { return this.ballScript.mustSync() || (this.getComponent(NetworkComponent)?.mustSyncFlag ?? false); }
  public setSync(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncFlag = v; }
  public mustSyncReliably(): boolean { return this.getComponent(NetworkComponent)?.mustSyncReliablyFlag ?? false; }
  public setSyncReliably(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncReliablyFlag = v; }

  // ── Transform queries (used by external callers) ──────────────

  public getX(): number { return this.getComponent(TransformComponent)?.x ?? 0; }
  public setX(x: number): void { const t = this.getComponent(TransformComponent); if (t) t.x = x; }
  public getY(): number { return this.getComponent(TransformComponent)?.y ?? 0; }
  public setY(y: number): void { const t = this.getComponent(TransformComponent); if (t) t.y = y; }
  public getWidth(): number { return this.getComponent(TransformComponent)?.width ?? 0; }
  public getHeight(): number { return this.getComponent(TransformComponent)?.height ?? 0; }
  public setVX(vx: number): void { const p = this.getComponent(PhysicsComponent); if (p) p.vx = vx; }
  public setVY(vy: number): void { const p = this.getComponent(PhysicsComponent); if (p) p.vy = vy; }

  // ── Network (delegates to BallScript) ─────────────────────────

  public override serialize(): ArrayBuffer {
    return this.ballScript.serialize();
  }

  public override synchronize(arrayBuffer: ArrayBuffer): void {
    this.ballScript.synchronize(arrayBuffer);
  }

  public override getReplayState(): ArrayBuffer | null {
    return this.ballScript.getReplayState();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    this.ballScript.applyReplayState(arrayBuffer);
  }

  // ── Public API (delegates to BallScript) ──────────────────────

  public isInactive(): boolean {
    return this.ballScript.isInactive();
  }

  public setInactive(inactive: boolean): void {
    this.ballScript.setInactive(inactive);
  }

  public handleGoalScored(): void {
    this.ballScript.handleGoalScored();
  }

  public getLastPlayer(): GamePlayer | null {
    return this.ballScript.getLastPlayer();
  }

  public clearLastPlayerIfMatches(player: GamePlayer): void {
    this.ballScript.clearLastPlayerIfMatches(player);
  }

  public setWeatherFrictionMultiplier(multiplier: number): void {
    this.ballScript.setWeatherFrictionMultiplier(multiplier);
  }

  public updateHitbox(): void {
    this.ballScript.updateHitbox();
  }

  public getTrajectoryPoints(steps = 60): { x: number; y: number }[] {
    return this.ballScript.getTrajectoryPoints(steps);
  }

  private setSyncableValues(): void {
    const n = this.getComponent(NetworkComponent)!;
    n.syncable = true;
    this.setId(BALL_NETWORK_ID);
    n.typeId = EntityRegistryType.Ball;
    n.syncableByHost = true;
  }
}
