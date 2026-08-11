import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { MatchSessionService } from "../services/session/match-session-service.js";
import { DebugUtils } from "../../engine/utils/debug-utils.js";

export class SpawnPointScript implements ScriptLifecycle {
  private matchSessionService: MatchSessionService | null = null;
  private index: number;
  private transform!: TransformComponent;

  constructor(index: number) { this.index = index; }

  resolveTransform(transform: TransformComponent): void { this.transform = transform; }

  getIndex(): number { return this.index; }
  setMatchSessionService(s: MatchSessionService): void { this.matchSessionService = s; }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    const radius = 12;
    const t = this.transform;
    context.beginPath();
    context.arc(t.x, t.y, radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 165, 0, 0.7)";
    context.fill(); context.closePath();

    let playerInfo: string | null = null;
    if (this.matchSessionService) {
      const match = this.matchSessionService.getMatch();
      if (match) {
        const assigned = match.getPlayers().find((p) => p.getSpawnPointIndex() === this.index);
        if (assigned) playerInfo = assigned.getName();
      }
    }

    const textX = t.x - t.width / 2; const textY = t.y + t.height / 2 + 5;
    DebugUtils.renderText(context, textX, textY, "Spawn");
    if (playerInfo !== null) DebugUtils.renderText(context, textX, textY + 24, `> ${playerInfo}`);
    context.restore();
  }
}
