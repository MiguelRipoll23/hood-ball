import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { GamePlayer } from "../models/game-player.js";

/**
 * Script behaviour for the welcome message ("HEY, YOU!" + player name).
 * Attached to WelcomeMessageEntity via ScriptComponent.
 */
export class WelcomeMessageScript implements ScriptLifecycle {
  private readonly gamePlayer: GamePlayer;
  private readonly canvas: HTMLCanvasElement;

  constructor(
    canvas: HTMLCanvasElement,
    gamePlayer: GamePlayer,
  ) {
    this.canvas = canvas;
    this.gamePlayer = gamePlayer;
  }

  render(context: CanvasRenderingContext2D): void {
    const playerName = this.gamePlayer.getName() || "Unknown";

    context.save();
    context.font = "bold 28px system-ui";
    context.fillStyle = "white";
    context.textAlign = "center";

    context.fillText(
      "HEY, YOU!",
      this.canvas.width / 2,
      this.canvas.height - 140,
    );

    context.fillStyle = "#7ed321";
    context.fillText(
      playerName,
      this.canvas.width / 2,
      this.canvas.height - 100,
    );
    context.restore();
  }
}
