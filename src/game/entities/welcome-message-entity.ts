import { BaseMoveableGameEntity } from "../../engine/entities/base-moveable-game-entity.js";
import { GamePlayer } from "../models/game-player.js";

export class WelcomeMessageEntity extends BaseMoveableGameEntity {
  private readonly gamePlayer: GamePlayer;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    gamePlayer: GamePlayer
  ) {
    super();
    this.gamePlayer = gamePlayer;
  }

  public override render(context: CanvasRenderingContext2D): void {
    const playerName = this.gamePlayer.getName() || "Unknown";

    context.save();
    this.applyOpacity(context);
    context.font = "bold 28px system-ui";
    context.fillStyle = "white";
    context.textAlign = "center";

    context.fillText(
      "HEY, YOU!",
      this.canvas.width / 2,
      this.canvas.height - 140
    );

    context.fillStyle = "#7ed321";
    context.fillText(
      playerName,
      this.canvas.width / 2,
      this.canvas.height - 100
    );
    context.restore();
  }
}
