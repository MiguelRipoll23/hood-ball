import { BaseMoveableGameEntity } from "../../engine/entities/base-moveable-game-entity.ts";
import { GamePlayer } from "../models/game-player.ts";
import { gameContext } from "../context/game-context.ts";

export class WelcomeMessageEntity extends BaseMoveableGameEntity {
  private gamePlayer: GamePlayer;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.gamePlayer = gameContext.get(GamePlayer);
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
