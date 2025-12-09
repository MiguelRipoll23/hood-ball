import { MatchActionType } from "../enums/match-action-type.ts";

interface PlayerActionOptions {
  timestamp?: number;
  playerName?: string | null;
}

interface DemolitionActionOptions {
  timestamp?: number;
  attackerName?: string | null;
  victimName?: string | null;
}

interface ChatCommandActionOptions extends PlayerActionOptions {}
interface ChatMessageActionOptions extends PlayerActionOptions {}

export class MatchAction {
  private fadeOutStartTimestamp: number | null = null;
  private fadeOutDurationMs = 0;

  private constructor(
    private readonly type: MatchActionType,
    private readonly timestamp: number,
    private readonly scorerId: string | null,
    private readonly attackerId: string | null,
    private readonly victimId: string | null,
    private readonly commandName: string | null,
    private readonly messageText: string | null,
    private readonly scorerName: string | null,
    private readonly attackerName: string | null,
    private readonly victimName: string | null
  ) {}

  public static goal(
    playerId: string,
    options: PlayerActionOptions = {}
  ): MatchAction {
    const { timestamp = Date.now(), playerName = null } = options;

    return new MatchAction(
      MatchActionType.Goal,
      timestamp,
      playerId,
      null,
      null,
      null,
      null,
      playerName,
      null,
      null
    );
  }

  public static demolition(
    attackerId: string,
    victimId: string,
    options: DemolitionActionOptions = {}
  ): MatchAction {
    const {
      timestamp = Date.now(),
      attackerName = null,
      victimName = null,
    } = options;

    return new MatchAction(
      MatchActionType.Demolition,
      timestamp,
      null,
      attackerId,
      victimId,
      null,
      null,
      null,
      attackerName,
      victimName
    );
  }

  public static playerJoined(
    playerId: string,
    options: PlayerActionOptions = {}
  ): MatchAction {
    const { timestamp = Date.now(), playerName = null } = options;

    return new MatchAction(
      MatchActionType.PlayerJoined,
      timestamp,
      playerId,
      null,
      null,
      null,
      null,
      playerName,
      null,
      null
    );
  }

  public static playerLeft(
    playerId: string,
    options: PlayerActionOptions = {}
  ): MatchAction {
    const { timestamp = Date.now(), playerName = null } = options;

    return new MatchAction(
      MatchActionType.PlayerLeft,
      timestamp,
      playerId,
      null,
      null,
      null,
      null,
      playerName,
      null,
      null
    );
  }

  public static chatCommand(
    playerId: string,
    commandName: string,
    options: ChatCommandActionOptions = {}
  ): MatchAction {
    const { timestamp = Date.now(), playerName = null } = options;

    return new MatchAction(
      MatchActionType.ChatCommand,
      timestamp,
      playerId,
      null,
      null,
      commandName,
      null,
      playerName,
      null,
      null
    );
  }

  public static chatMessage(
    playerId: string,
    message: string,
    options: ChatMessageActionOptions = {}
  ): MatchAction {
    const { timestamp = Date.now(), playerName = null } = options;

    return new MatchAction(
      MatchActionType.ChatMessage,
      timestamp,
      playerId,
      null,
      null,
      null,
      message,
      playerName,
      null,
      null
    );
  }

  public getType(): MatchActionType {
    return this.type;
  }

  public isGoal(): boolean {
    return this.type === MatchActionType.Goal;
  }

  public isDemolition(): boolean {
    return this.type === MatchActionType.Demolition;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public getScorerId(): string | null {
    return this.scorerId;
  }

  public getActorId(): string | null {
    return this.scorerId;
  }

  public getPlayerId(): string | null {
    return this.scorerId;
  }

  public getScorerName(): string | null {
    return this.scorerName;
  }

  public getActorName(): string | null {
    return this.scorerName;
  }

  public getAttackerId(): string | null {
    return this.attackerId;
  }

  public getAttackerName(): string | null {
    return this.attackerName;
  }

  public getVictimId(): string | null {
    return this.victimId;
  }

  public getVictimName(): string | null {
    return this.victimName;
  }

  public getCommandName(): string | null {
    return this.commandName;
  }

  public getMessageText(): string | null {
    return this.messageText;
  }

  public startFadeOut(
    durationMs: number,
    startTimestamp: number = Date.now()
  ): void {
    if (this.fadeOutStartTimestamp !== null) {
      return;
    }

    this.fadeOutStartTimestamp = startTimestamp;
    this.fadeOutDurationMs = durationMs;
  }

  public isFadingOut(): boolean {
    return this.fadeOutStartTimestamp !== null;
  }

  public getFadeOutStartTimestamp(): number | null {
    return this.fadeOutStartTimestamp;
  }

  public getFadeOutDurationMs(): number {
    return this.fadeOutDurationMs;
  }
}
