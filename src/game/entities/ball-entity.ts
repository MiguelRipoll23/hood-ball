import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PhysicsComponent } from "../../engine/components/physics-component.js";
import { CollisionComponent } from "../../engine/components/collision-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BallScript } from "../scripts/ball-script.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
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
    this.ballScript.reset(this.canvas.width / 2, this.canvas.height / 2);
    super.reset();
  }

  public setCenterPosition(): void {
    this.ballScript.setCenterPosition(this.canvas.width, this.canvas.height);
  }

  public override teleport(x: number, y: number, angle?: number): void {
    this.ballScript.teleport(x, y, angle);
  }

  // ── Network (delegates to BallScript) ─────────────────────────

  public override mustSync(): boolean {
    return this.ballScript.mustSync();
  }

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
    this.setSyncable(true);
    this.setId(BALL_NETWORK_ID);
    this.setTypeId(EntityRegistryType.Ball);
    this.setSyncableByHost(true);
  }
}
