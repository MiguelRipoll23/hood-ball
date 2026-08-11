import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";
import type { ActionMenuContract } from "../interfaces/ui/action-menu-contract.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { BanMenuScript } from "../scripts/ban-menu-script.js";

/**
 * Pure component container for the ban-player modal. All UI rendering,
 * pointer handling, and state management lives in {@link BanMenuScript}.
 */
export class BanMenuEntity
  extends BaseGameEntity
  implements ActionMenuContract
{
  private readonly script: BanMenuScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const input = this.addComponent(new InputComponent());
    this.script = new BanMenuScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveInput(input);
    this.opacity = 0;
  }

  // ── ActionMenuContract (delegates to script) ─────────────────

  public isOpen(): boolean { return this.script.isOpened; }
  public getBannedPlayer(): GamePlayer | null { return this.script.getBannedPlayer(); }
  public getConfirmedData(): {
    reason: string;
    duration?: { value: number; unit: string };
  } | null {
    return this.script.getConfirmedData();
  }
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
