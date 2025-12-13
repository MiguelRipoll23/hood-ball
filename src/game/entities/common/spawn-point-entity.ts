import { BaseMoveableGameEntity } from "../../../engine/entities/base-moveable-game-entity";
import type { MatchSession } from "../../models/match-session.js";

export class SpawnPointEntity extends BaseMoveableGameEntity {
  private matchSession: MatchSession | null = null;

  constructor(private index: number, x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }

  public getIndex(): number {
    return this.index;
  }

  public setMatchSession(matchSession: MatchSession | null): void {
    this.matchSession = matchSession;
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

      // Draw debug text
      context.font = "12px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";
      context.strokeStyle = "#000000";
      context.lineWidth = 3;

      // First line: "Spawn point"
      const line1 = "Spawn point";
      const line1Y = this.y - 20;
      context.strokeText(line1, this.x, line1Y);
      context.fillText(line1, this.x, line1Y);

      // Second line: Player name or "Free"
      let line2 = "Free";
      if (this.matchSession) {
        const players = this.matchSession.getPlayers();
        const assignedPlayer = players.find(
          (p) => p.getSpawnPointIndex() === this.index
        );
        if (assignedPlayer) {
          line2 = assignedPlayer.getName();
        }
      }
      const line2Y = this.y - 8;
      context.strokeText(line2, this.x, line2Y);
      context.fillText(line2, this.x, line2Y);

      context.restore();
    }
  }
}
