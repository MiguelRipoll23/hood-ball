import { BaseMoveableGameEntity } from "../../core/entities/base-moveable-game-entity.js";
import type { GameState } from "../state/game-state.js";

export class WelcomeMessageEntity extends BaseMoveableGameEntity {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gameState: GameState
  ) {
    super();
  }

  public override render(context: CanvasRenderingContext2D): void {
    const playerName = this.gameState.getGamePlayer()?.getName() || "Unknown";

    context.save();
    this.applyOpacity(context);
    context.font = "bold 28px system-ui";
    context.fillStyle = "white";
    context.textAlign = "center";

    context.fillText("HEY, YOU!", this.canvas.width / 2, this.canvas.height - 140);

    context.fillStyle = "#7ed321";
    context.fillText(playerName, this.canvas.width / 2, this.canvas.height - 100);
    context.restore();
  }
}
