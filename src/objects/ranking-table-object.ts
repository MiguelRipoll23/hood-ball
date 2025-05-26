import { BaseAnimatedGameObject } from "./base/base-animated-object.js";
import type { RankingResponse } from "../interfaces/response/ranking-response.js";

export class RankingTableObject extends BaseAnimatedGameObject {
  private ranking: RankingResponse[] = [];

  public setRanking(ranking: RankingResponse[]): void {
    this.ranking = ranking;
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalAlpha = this.opacity;

    context.font = "bold 24px system-ui";
    context.textAlign = "left";

    const startX = 30;
    let startY = 100;

    this.ranking.forEach((player, index) => {
      context.fillStyle = "white";
      context.fillText(`#${index + 1}`, startX, startY);
      context.fillText(player.playerName, startX + 50, startY);
      context.fillText(
        player.score.toString(),
        context.canvas.width - 40,
        startY
      );
      startY += 40;

      // Draw dashed line between rows
      if (index < this.ranking.length - 1) {
        context.strokeStyle = "#BDBDBD";
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(startX, startY - 27.5);
        context.lineTo(context.canvas.width - 25, startY - 27.5);
        context.stroke();
      }
    });

    context.restore();
  }

  public fadeIn(seconds: number): void {
    super.fadeIn(seconds);
  }
}
