import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import type { GamePlayer } from "../models/game-player.js";
import type { PlayerModerationService } from "../services/network/player-moderation-service.js";
import type { APIService } from "../services/network/api-service.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { MatchMenuScript } from "../scripts/match-menu-script.js";

/**
 * Thin container for the match menu overlay. All orchestration logic
 * lives in {@link MatchMenuScript}. The entity handles opacity gating
 * and delegates update/render to the script directly (since the script
 * needs opacity context not available through ScriptLifecycle).
 */
export class MatchMenuEntity extends BaseGameEntity {
  private readonly script: MatchMenuScript;

  constructor(
    canvas: HTMLCanvasElement,
    moderationService: PlayerModerationService,
    apiService: APIService,
    gamePointer: GamePointerContract,
    onClose: () => void,
    onLeaveMatch: () => void,
  ) {
    super();
    this.addComponent(new InputComponent());
    this.script = new MatchMenuScript(
      canvas, moderationService, apiService,
      gamePointer, onClose, onLeaveMatch,
    );
    this.opacity = 0;
  }

  public override load(): void {
    this.script.load();
    super.load();
  }

  public show(): void {
    this.getComponent(InputComponent)!.active = true;
    this.opacity = 1;
  }

  public close(): void {
    this.getComponent(InputComponent)!.active = false;
    this.opacity = 0;
  }

  public setPlayers(players: GamePlayer[], localPlayerId: string): void {
    this.script.setPlayers(players, localPlayerId);
  }

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    if (!this.getComponent(InputComponent)!.active || this.opacity === 0) return;
    this.script.handlePointerEvent(gamePointer, this.opacity);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);
    if (this.opacity > 0) {
      this.script.update(deltaTimeStamp);
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    if (this.opacity === 0) return;

    context.save();
    context.globalAlpha = this.opacity;
    this.script.render(context);
    context.restore();
  }
}
