import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";
import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { APIService } from "../services/network/api-service.js";
import { PlayersListScript } from "../scripts/players-list-script.js";

/**
 * Pure component container for the players list. All item management,
 * popup orchestration, and rendering lives in {@link PlayersListScript}.
 */
export class PlayersListEntity extends BaseGameEntity {
  private readonly script: PlayersListScript;

  constructor(apiService: APIService) {
    super();
    this.script = new PlayersListScript(apiService);
    this.addComponent(new ScriptComponent(this.script));
  }

  public setPlayers(
    players: GamePlayer[],
    localPlayerId: string,
    x: number,
    y: number,
    width: number,
    gamePointer: GamePointerContract,
    onReport: (playerId: string, reason: string, playerName: string) => void,
    onBan: (
      playerId: string,
      reason: string,
      playerName: string,
      duration?: { value: number; unit: string },
    ) => void,
    canvas: HTMLCanvasElement,
  ): void {
    this.script.setPlayers(
      players, localPlayerId, x, y, width,
      gamePointer, onReport, onBan, canvas,
    );
  }

  public isActionMenuOpen(): boolean { return this.script.isActionMenuOpen(); }

  public handlePointerEvent(gamePointer: GamePointerContract): void {
    this.script.handlePointerEvent(gamePointer);
  }

  public closeActiveActionMenu(): void { this.script.closeActiveActionMenu(); }
}
