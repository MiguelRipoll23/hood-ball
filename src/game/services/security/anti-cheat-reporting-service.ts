import { injectable, inject } from "@needle-di/core";
import { PlayerModerationService } from "../network/player-moderation-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

/** A reported violation with metadata for inspector display. */
export interface ReportedViolation {
  ruleId: number;
  userId: string;
  reason: string;
  /** Unix timestamp (ms) when the violation was first reported. */
  timestamp: number;
}

@injectable()
export class AntiCheatReportingService {
  /** Full history of reported violations. */
  private readonly violations: ReportedViolation[] = [];

  /** Returns a snapshot of all reported violations. */
  public getReportedViolations(): readonly ReportedViolation[] {
    return this.violations;
  }

  /** Returns whether a specific violation has been reported. */
  public isReported(ruleId: number, userId: string): boolean {
    return this.violations.some(
      (v) => v.ruleId === ruleId && v.userId === userId,
    );
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

    if (this.isReported(ruleId, userId)) return;

    const violation: ReportedViolation = {
      ruleId,
      userId,
      reason,
      timestamp: Date.now(),
    };
    this.violations.push(violation);

    this.send(userId, ruleId);

    EngineLogger.warn(
      "AntiCheatReportingService",
      `[AntiCheat] Rule ${ruleId} violated by ${userId}: ${reason}`,
    );
  }

  private send(userId: string, ruleId: number): void {
    this.playerModerationService
      .reportAutomaticViolation(userId, ruleId)
      .catch((error: unknown) => {
        EngineLogger.error(
          "AntiCheatReportingService",
          "[AntiCheat] Failed to send report:",
          error,
        );
      });
  }
}
