import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import type { EntityType } from "../../engine/enums/entity-type.js";
import type { Player } from "../../engine/interfaces/models/player-interface.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import type { ScoreboardUI } from "../interfaces/ui/scoreboard-ui-interface.js";
import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { ScoreboardScript } from "../scripts/scoreboard-script.js";

/**
 * Pure component container for the scoreboard HUD. All rendering, timer
 * logic, and serialization lives in {@link ScoreboardScript}.
 */
export class ScoreboardEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity, ScoreboardUI
{
  private readonly script: ScoreboardScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new NetworkComponent());
    this.script = new ScoreboardScript(canvas);
    this.addComponent(new ScriptComponent(this.script));

    this.setId("d4e5f6a78b9c0d1e2f3a4b5c6d7e8f9a");
    const n = this.getComponent(NetworkComponent)!;
    n.typeId = EntityRegistryType.Scoreboard;
    n.syncableByHost = true;
  }

  public static getTypeId(): EntityRegistryType {
    return EntityRegistryType.Scoreboard;
  }

  // ── MultiplayerGameEntity (thin wrappers) ─────────────────────

  public getTypeId(): EntityType | null { return this.getComponent(NetworkComponent)?.typeId ?? null; }
  public getOwner(): Player | null { return this.getComponent(NetworkComponent)?.owner ?? null; }
  public setOwner(p: Player | null): void { const n = this.getComponent(NetworkComponent); if (n) n.owner = p; }
  public isSyncable(): boolean { return this.getComponent(NetworkComponent)?.syncable ?? false; }
  public isSyncableByHost(): boolean { return this.getComponent(NetworkComponent)?.syncableByHost ?? false; }
  public mustSync(): boolean { return this.getComponent(NetworkComponent)?.mustSyncFlag ?? false; }
  public setSync(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncFlag = v; }
  public mustSyncReliably(): boolean { return this.getComponent(NetworkComponent)?.mustSyncReliablyFlag ?? false; }
  public setSyncReliably(v: boolean): void { const n = this.getComponent(NetworkComponent); if (n) n.mustSyncReliablyFlag = v; }

  // ── ScoreboardUI (delegates to script) ────────────────────────

  public isActive(): boolean { return this.script._sactive; }
  public setActive(active: boolean): void { this.script._sactive = active; }
  public setTimerDuration(durationSeconds: number): void { this.script.setTimerDuration(durationSeconds); }
  public startTimer(): void { this.script.startTimer(); }
  public stopTimer(): void { this.script.stopTimer(); }
  public getElapsedMilliseconds(): number { return this.script.elapsedMilliseconds; }
  public reset(): void { super.reset(); this.script.reset(); }
  public incrementBlueScore(): void { this.script.incrementBlueScore(); }
  public incrementRedScore(): void { this.script.incrementRedScore(); }
  public setBlueScore(score: number): void { this.script.setBlueScore(score); }
  public setRedScore(score: number): void { this.script.setRedScore(score); }
  public hasTimerFinished(): boolean { return this.script.hasTimerFinished(); }

  // ── Serialization (delegates to script) ───────────────────────

  public serialize(): ArrayBuffer { return this.script.serialize(); }
  public synchronize(arrayBuffer: ArrayBuffer): void { this.script.synchronize(arrayBuffer); }
  public override getReplayState(): ArrayBuffer | null { return this.script.getReplayState(); }
  public override applyReplayState(arrayBuffer: ArrayBuffer): void { this.script.applyReplayState(arrayBuffer); }
}
