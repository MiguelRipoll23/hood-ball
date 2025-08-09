import { MatchStateType } from "../../enums/match-state-type.js";
import { EventType } from "../../enums/event-type.js";
import { TeamType } from "../../enums/team-type.js";

import { RemoteEvent } from "../../../core/models/remote-event.js";
import { GameState } from "../../../core/models/game-state.js";
import { GamePlayer } from "../../models/game-player.js";

import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";

import { BallEntity } from "../../entities/ball-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import type { ScoreboardUI } from "../../interfaces/ui/scoreboard-ui.js";
import { AlertEntity } from "../../entities/alert-entity.js";

import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";

export class ScoreManagerService {
  constructor(
    private readonly gameState: GameState,
    private readonly ballEntity: BallEntity,
    private readonly goalEntity: GoalEntity,
    private readonly scoreboardUI: ScoreboardUI,
    private readonly alertEntity: AlertEntity,
    private readonly timerManagerService: TimerManagerService,
    private readonly eventProcessorService: EventProcessorService,
    private readonly matchmakingService: IMatchmakingService,
    private readonly goalTimeEndCallback: () => void,
    private readonly gameOverEndCallback: () => void,
    private readonly explosionCallback: (
      x: number,
      y: number,
      team: TeamType
    ) => void,
    private readonly gameOverEffectCallback: (won: boolean) => void
  ) {}

  public updateScoreboard(): void {
    const players = this.gameState.getMatch()?.getPlayers() ?? [];
    let totalScore = 0;

    players.forEach((player) => {
      const score = player.getScore();

      if (player === this.gameState.getGamePlayer()) {
        this.scoreboardUI.setBlueScore(score);
        return;
      }

      totalScore += score;
    });

    this.scoreboardUI.setRedScore(totalScore);
  }

  public detectScoresIfHost(): void {
    const host = this.gameState.getMatch()?.isHost() ?? false;
    const matchState = this.gameState.getMatch()?.getState();

    if (host && matchState === MatchStateType.InProgress) {
      this.detectScores();
      this.detectGameEnd();
    }
  }

  public handleRemoteGoal(arrayBuffer: ArrayBuffer | null): void {
    if (arrayBuffer === null) {
      console.warn("Array buffer is null");
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      console.warn("Host should not receive goal event");
      return;
    }

    this.scoreboardUI.stopTimer();
    this.ballEntity.handleGoalScored();
    this.gameState.setMatchState(MatchStateType.GoalScored);

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const playerId = binaryReader.fixedLengthString(32);
    const playerScore = binaryReader.unsignedInt8();
    const player =
      this.gameState.getMatch()?.getPlayerByNetworkId(playerId) ?? null;

    player?.setScore(playerScore);
    this.updateScoreboard();

    let team: TeamType = TeamType.Red;

    if (player === this.gameState.getGamePlayer()) {
      team = TeamType.Blue;
    }

    this.showGoalAlert(player, team);
    this.explosionCallback(
      this.ballEntity.getX(),
      this.ballEntity.getY(),
      team
    );
  }

  public handleRemoteGameOverStartEvent(arrayBuffer: ArrayBuffer | null): void {
    if (arrayBuffer === null) {
      console.warn("Array buffer is null");
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      console.warn("Host should not receive game over event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const playerId = binaryReader.fixedLengthString(32);
    const player =
      this.gameState.getMatch()?.getPlayerByNetworkId(playerId) ?? null;

    this.handleGameOverStart(player);
  }

  private detectScores(): void {
    const playersCount = this.gameState.getMatch()?.getPlayers().length ?? 0;

    if (playersCount < 2) {
      return;
    }

    const goalScored = this.goalEntity
      .getCollidingEntities()
      .includes(this.ballEntity);

    if (goalScored) {
      this.handleGoalScored();
    }
  }

  private handleGoalScored(): void {
    const player = this.ballEntity.getLastPlayer();

    if (player === null) {
      console.warn("Player is null");
      return;
    }

    this.scoreboardUI.stopTimer();
    this.ballEntity.handleGoalScored();
    this.gameState.setMatchState(MatchStateType.GoalScored);

    player.sumScore(1);
    this.sendGoalEvent(player);

    const goalTeam =
      player === this.gameState.getGamePlayer() ? TeamType.Blue : TeamType.Red;

    if (goalTeam === TeamType.Blue) {
      this.scoreboardUI.incrementBlueScore();
    } else {
      this.scoreboardUI.incrementRedScore();
    }

    this.showGoalAlert(player, goalTeam);
    this.explosionCallback(
      this.ballEntity.getX(),
      this.ballEntity.getY(),
      goalTeam
    );
    this.timerManagerService.createTimer(5, this.goalTimeEndCallback);
  }

  private sendGoalEvent(player: GamePlayer): void {
    const playerId = player.getNetworkId();
    const playerScore = player.getScore();

    const payload = BinaryWriter.build()
      .fixedLengthString(playerId, 32)
      .unsignedInt8(playerScore)
      .toArrayBuffer();

    const goalEvent = new RemoteEvent(EventType.GoalScored);
    goalEvent.setData(payload);

    this.eventProcessorService.sendEvent(goalEvent);
  }

  private showGoalAlert(
    player: GamePlayer | null | undefined,
    goalTeam: TeamType
  ): void {
    const playerName = player?.getName().toUpperCase() || "UNKNOWN";

    let color = "white";

    if (goalTeam === TeamType.Blue) {
      color = "blue";
    } else if (goalTeam === TeamType.Red) {
      color = "red";
    }

    this.alertEntity.show([playerName, "SCORED!"], color);
  }

  private detectGameEnd(): void {
    if (this.gameState.getMatch()?.getState() === MatchStateType.GameOver) {
      return;
    }

    if (this.scoreboardUI.hasTimerFinished()) {
      this.handleTimerEnd();
    }
  }

  private handleTimerEnd(): void {
    const players = this.gameState.getMatch()?.getPlayers() || [];
    let winner = this.gameState.getGamePlayer();

    for (const player of players) {
      if (player.getScore() > winner.getScore()) {
        winner = player;
      }
    }

    const isTie = players.every(
      (player) => player.getScore() === winner.getScore()
    );

    if (isTie) {
      return;
    }

    this.sendGameOverStartEvent(winner);
    this.handleGameOverStart(winner);
  }

  private sendGameOverStartEvent(winner: GamePlayer): void {
    const playerId = winner.getNetworkId();

    const payload = BinaryWriter.build()
      .fixedLengthString(playerId, 32)
      .toArrayBuffer();

    const gameOverStartEvent = new RemoteEvent(EventType.GameOver);
    gameOverStartEvent.setData(payload);

    this.eventProcessorService.sendEvent(gameOverStartEvent);
  }

  private handleGameOverStart(winner: GamePlayer | null): void {
    this.gameState.endMatch();

    const isLocalWinner = winner === this.gameState.getGamePlayer();
    const playerName = winner?.getName().toUpperCase() ?? "UNKNOWN";
    const playerTeam = isLocalWinner ? "blue" : "red";

    if (isLocalWinner) {
      this.alertEntity.show(["YOU", "WON!"], playerTeam);
    } else {
      this.alertEntity.show([playerName, "WINS!"], playerTeam);
    }

    this.gameOverEffectCallback(isLocalWinner);
    this.timerManagerService.createTimer(5, this.gameOverEndCallback);

    if (this.gameState.getMatch()?.isHost()) {
      this.matchmakingService
        .savePlayerScore()
        .catch((error) => console.error("Failed to save player scores", error));
    }
  }
}
