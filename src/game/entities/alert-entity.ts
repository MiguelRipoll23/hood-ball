import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { AlertScript } from "../scripts/alert-script.js";
import type { MultiplayerGameEntity } from "../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import type { EntityType } from "../../engine/enums/entity-type.js";
import type { Player } from "../../engine/interfaces/models/player-interface.js";

/**
 * Pure component container for the alert UI. All show/hide, animations,
 * text rendering, timer, and replay state logic live in {@link AlertScript}.
 */
export class AlertEntity
  extends BaseGameEntity
  implements MultiplayerGameEntity
{
  private readonly script: AlertScript;

  constructor(protected readonly canvas: HTMLCanvasElement) {
    super();
    const anim = this.addComponent(new AnimationComponent());
    const transform = this.addComponent(new TransformComponent());
    this.addComponent(new NetworkComponent());

    this.script = new AlertScript();
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(canvas, transform, anim);
  }

  // ── Public API (delegates to AlertScript) ─────────────────────

  public show(textLines: string[], color = "white", duration = 0): void {
    this.script.show(textLines, color, duration);
  }

  public showColored(textLines: string[], colors: string[], duration = 0): void {
    this.script.showColored(textLines, colors, duration);
  }

  public hide(): void {
    this.script.hide();
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
  public serialize(): ArrayBuffer { return new ArrayBuffer(0); }
  public synchronize(_arrayBuffer: ArrayBuffer): void { /* not synchronised */ }

  // ── Opacity sync (AlertScript needs to know entity opacity) ────

  public override getReplayState(): ArrayBuffer | null {
    return this.script.getReplayState();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    this.script.applyReplayState(arrayBuffer);
  }

  // Keep opacity in sync with the script for BaseGameEntity's animation system
  public override getOpacity(): number {
    return this.script.getOpacity();
  }

  public override setOpacity(opacity: number): void {
    super.setOpacity(opacity);
    this.script.setOpacityFromEntity(opacity);
  }
}
