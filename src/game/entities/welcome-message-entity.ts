import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { GamePlayer } from "../models/game-player.js";
import { WelcomeMessageScript } from "../scripts/welcome-message-script.js";

/**
 * Pure component container for the welcome message. All rendering
 * logic lives in {@link WelcomeMessageScript}.
 */
export class WelcomeMessageEntity extends BaseGameEntity {
  constructor(
    canvas: HTMLCanvasElement,
    gamePlayer: GamePlayer,
  ) {
    super();
    const script = new WelcomeMessageScript(canvas, gamePlayer);
    this.addComponent(new ScriptComponent(script));
  }
}
