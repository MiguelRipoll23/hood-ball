import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { PlayerListItemScript } from "../scripts/player-list-item-script.js";

/**
 * Pure component container for a player list item row. All rendering
 * and button logic lives in {@link PlayerListItemScript}.
 */
export class PlayerListItemEntity extends BaseGameEntity {
  private readonly script: PlayerListItemScript;

  constructor(
    player: GamePlayer,
    isLocalPlayer: boolean,
    x: number,
    y: number,
    containerWidth: number,
    isModerator: boolean,
  ) {
    super();
    const transform = this.addComponent(new TransformComponent());

    this.script = new PlayerListItemScript(
      player, isLocalPlayer, containerWidth, isModerator,
    );
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveTransform(transform);
    this.script.init(x, y);
  }

  public getPlayer(): GamePlayer { return this.script.getPlayer(); }
  public setPosition(x: number, y: number): void { this.script.setPosition(x, y); }
  public setContainerWidth(width: number): void { this.script.setContainerWidth(width); }

  public override load(): void {
    this.script.load();
    super.load();
  }

  public handlePointerEvent(
    gamePointer: import("../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract,
  ): void {
    this.script.handlePointerEvent(gamePointer);
  }

  public isReportButtonPressed(): boolean { return this.script.isReportButtonPressed(); }
  public isBanButtonPressed(): boolean { return this.script.isBanButtonPressed(); }
}
