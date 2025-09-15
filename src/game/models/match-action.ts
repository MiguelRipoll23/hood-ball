import { MatchActionType } from "../enums/match-action-type.js";

export class MatchAction {
  private constructor(
    private readonly type: MatchActionType,
    private readonly timestamp: number,
    private readonly scorerId: string | null,
    private readonly attackerId: string | null,
    private readonly victimId: string | null
  ) {}

  public static goal(playerId: string, timestamp: number = Date.now()): MatchAction {
    return new MatchAction(MatchActionType.Goal, timestamp, playerId, null, null);
  }

  public static demolition(
    attackerId: string,
    victimId: string,
    timestamp: number = Date.now()
  ): MatchAction {
    return new MatchAction(
      MatchActionType.Demolition,
      timestamp,
      null,
      attackerId,
      victimId
    );
  }

  public getType(): MatchActionType {
    return this.type;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public getScorerId(): string | null {
    return this.scorerId;
  }

  public getAttackerId(): string | null {
    return this.attackerId;
  }

  public getVictimId(): string | null {
    return this.victimId;
  }
}
