import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { AnimationComponent } from "../../engine/components/animation-component.js";
import type { UserScore } from "../interfaces/responses/user-scores-response-interface.js";

export class RankingTableScript implements ScriptLifecycle {
  ranking: UserScore[] = [];
  private animation!: AnimationComponent;

  resolveAnimation(animation: AnimationComponent): void { this.animation = animation; }

  fadeIn(seconds: number): void { this.animation.fadeIn(seconds); }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.font = "bold 24px system-ui";
    const startX = 30; let startY = 100;

    this.ranking.forEach((player, index) => {
      context.fillStyle = "white"; context.textAlign = "left";
      context.fillText(`#${index + 1}`, startX, startY);
      context.fillText(player.userDisplayName, startX + 50, startY);
      context.textAlign = "right";
      context.fillText(player.totalScore.toString(), context.canvas.width - 25, startY);
      startY += 40;
      if (index < this.ranking.length - 1) {
        context.strokeStyle = "#BDBDBD"; context.setLineDash([5, 5]);
        context.beginPath(); context.moveTo(startX, startY - 27.5);
        context.lineTo(context.canvas.width - 25, startY - 27.5); context.stroke();
      }
    });
    context.restore();
  }
}
