import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";
import type { ActionMenuContract } from "../interfaces/ui/action-menu-contract.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { ReportMenuScript } from "../scripts/report-menu-script.js";

/**
 * Pure component container for the report-player modal. All UI rendering,
 * pointer handling, and state management lives in {@link ReportMenuScript}.
 */
export class ReportMenuEntity
  extends BaseGameEntity
  implements ActionMenuContract
{
  private readonly script: ReportMenuScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const input = this.addComponent(new InputComponent());
    this.script = new ReportMenuScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveInput(input);
    this.opacity = 0;
  }

  // ── ActionMenuContract (delegates to script) ─────────────────

  public isOpen(): boolean { return this.script.isOpened; }
  public getReportedPlayer(): GamePlayer | null { return this.script.getReportedPlayer(); }
  public getConfirmedReason(): string | null { return this.script.getConfirmedReason(); }
  public isCancelled(): boolean { return this.script.isCancelled(); }

  public open(player: GamePlayer): void {
    this.script.open(player);
    this.opacity = 1;
  }

  public close(): void {
    this.script.close();
    this.opacity = 0;
  }

  public handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.script.handlePointerEvent(gamePointer);
  }
}
