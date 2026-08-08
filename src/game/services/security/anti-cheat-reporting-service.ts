import { injectable, inject } from "@needle-di/core";
import { PlayerModerationService } from "../network/player-moderation-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

@injectable()
export class AntiCheatReportingService {
  /** Keys of already-reported violations. Format: `${ruleId}:${userId}` */
  private readonly reported = new Set<string>();

  /** Returns a snapshot of all reported violation keys. */
  public getReportedViolations(): readonly string[] {
    return [...this.reported];
  }

  /** Returns whether a specific violation has been reported. */
  public isReported(ruleId: number, userId: string): boolean {
    return this.reported.has(`${ruleId}:${userId}`);
  }

  constructor(
    private readonly playerModerationService: PlayerModerationService = inject(
      PlayerModerationService,
    ),
    private readonly gamePlayer: GamePlayer = inject(GamePlayer),
  ) {}

  public reportViolation(
    ruleId: number,
    reason: string,
    targetUserId?: string,
  ): void {
    const userId = targetUserId ?? this.gamePlayer.getNetworkId();
    const key = `${ruleId}:${userId}`;

    if (this.reported.has(key)) return;
    this.reported.add(key);

    const fullReason = `Rule #${ruleId}: ${reason}`;
    this.send(userId, fullReason);

    EngineLogger.warn("AntiCheatReportingService", `[AntiCheat] Rule ${ruleId} violated by ${userId}: ${reason}`);
  }

  private send(userId: string, reason: string): void {
    this.playerModerationService
      .reportUser(userId, `[AntiCheat] ${reason}`, true)
      .catch((error: unknown) => {
        EngineLogger.error("AntiCheatReportingService", "[AntiCheat] Failed to send report:", error);
      });
  }
}
