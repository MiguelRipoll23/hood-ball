import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { MatchAction } from "../models/match-action.js";
import type { GamePlayer } from "../models/game-player.js";
import type { MatchSessionService } from "../services/session/match-session-service.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { MatchLogScript } from "../scripts/match-log-script.js";

/**
 * Pure component container for the match actions log. All action
 * rendering, fade animations, and player-color logic lives in
 * {@link MatchLogScript}.
 */
export class MatchLogEntity extends BaseGameEntity {
  private readonly script: MatchLogScript;

  constructor(
    canvas: HTMLCanvasElement,
    matchSessionService: MatchSessionService,
    gamePlayer: GamePlayer,
  ) {
    super();
    const transform = this.addComponent(new TransformComponent());
    const anim = this.addComponent(new AnimationComponent());

    this.script = new MatchLogScript(matchSessionService, gamePlayer);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(canvas, transform, anim);
    this.opacity = 0;
  }

  public show(actions: MatchAction[]): void {
    this.script.show(actions, this.opacity);
  }
}
