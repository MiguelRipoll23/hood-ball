import { injectable, inject } from "@needle-di/core";
import { PlayerModerationService } from "../network/player-moderation-service.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { GamePlayer } from "../../models/game-player.js";

const REPORT_THROTTLE_MS = 5000;

@injectable()
export class AntiCheatReportingService {
  private readonly lastReportTime = new Map<number, number>();

  constructor(
    private readonly playerModerationService: PlayerModerationService = inject(
      PlayerModerationService,
    ),
    private readonly matchSessionService: MatchSessionService = inject(
      MatchSessionService,
    ),
    private readonly gamePlayer: GamePlayer = inject(GamePlayer),
  ) {}

  public reportViolation(
    ruleId: number,
    reason: string,
    targetUserId?: string,
  ): void {
    const now = Date.now();
    const lastReport = this.lastReportTime.get(ruleId);

    if (lastReport !== undefined && now - lastReport < REPORT_THROTTLE_MS) {
      return;
    }

    this.lastReportTime.set(ruleId, now);

    const fullReason = `Rule #${ruleId}: ${reason}`;
    const match = this.matchSessionService.getMatch();

    if (targetUserId) {
      this.send(targetUserId, fullReason);
    } else if (match) {
      for (const player of match.getPlayers()) {
        this.send(player.getNetworkId(), fullReason);
      }
    } else {
      this.send(this.gamePlayer.getNetworkId(), fullReason);
    }

    console.warn(`[AntiCheat] Rule ${ruleId} violated: ${reason}`);
  }

  private send(userId: string, reason: string): void {
    this.playerModerationService
      .reportUser(userId, `[AntiCheat] ${reason}`, true)
      .catch((error: unknown) => {
        console.error("[AntiCheat] Failed to send report:", error);
      });
  }
}
