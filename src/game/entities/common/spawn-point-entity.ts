import { BaseMoveableGameEntity } from "../../../engine/entities/base-moveable-game-entity";
import type { MatchSessionService } from "../../services/session/match-session-service.js";
import { DebugUtils } from "../../../engine/utils/debug-utils.js";

export class SpawnPointEntity extends BaseMoveableGameEntity {
  private matchSessionService: MatchSessionService | null = null;

  constructor(private index: number, x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    // Set dimensions to match the debug circle (radius = 12, diameter = 24)
    this.width = 24;
    this.height = 24;
  }

  public getIndex(): number {
    return this.index;
  }

  public setMatchSessionService(matchSessionService: MatchSessionService): void {
    this.matchSessionService = matchSessionService;
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.debugSettings?.isDebugging()) {
      context.save();

      const radius = 12;

      // Draw a larger orange circle without border
      context.beginPath();
      context.arc(this.x, this.y, radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 165, 0, 0.7)";
      context.fill();
      context.closePath();

      // Get player name if assigned
      let playerInfo: string | null = null;
      if (this.matchSessionService) {
        const match = this.matchSessionService.getMatch();
        if (match) {
          const players = match.getPlayers();
          const assignedPlayer = players.find(
            (p) => p.getSpawnPointIndex() === this.index
          );
          if (assignedPlayer) {
            playerInfo = assignedPlayer.getName();
          }
        }
      }

      // Use DebugUtils to render text like other entities
      // Position at bottom left of entity (using 24px spacing like matchmaking service)
      const textX = this.x - this.width / 2;
      const textY = this.y + this.height / 2 + 5;

      DebugUtils.renderText(
        context,
        textX,
        textY,
        "Spawn"
      );

      // Only show player name if assigned (with 24px vertical spacing like matchmaking service)
      if (playerInfo !== null) {
        DebugUtils.renderText(
          context,
          textX,
          textY + 24,
          `> ${playerInfo}`
        );
      }

      context.restore();
    }
  }
}
