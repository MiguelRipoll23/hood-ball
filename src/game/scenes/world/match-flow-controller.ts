import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { RemoteEvent } from "../../../core/models/remote-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { GameState } from "../../../core/models/game-state.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import type { IMatchmakingProvider } from "../../interfaces/services/gameplay/matchmaking-provider.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";

export class MatchFlowController {
  private readonly COUNTDOWN_START_NUMBER = 4;
  private countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;

  constructor(
    private readonly gameState: GameState,
    private readonly timerManagerService: TimerManagerService,
    private readonly eventProcessorService: EventProcessorService,
    private readonly matchmakingService: IMatchmakingProvider,
    private readonly scoreboardEntity: ScoreboardEntity,
    private readonly ballEntity: BallEntity,
    private readonly localCarEntity: LocalCarEntity,
    private readonly alertEntity: AlertEntity
  ) {}

  public handleMatchState(): void {
    const matchState = this.gameState.getMatch()?.getState();

    if (matchState === MatchStateType.InProgress) {
      this.localCarEntity.setActive(true);
      this.scoreboardEntity.setActive(true);
      this.ballEntity.setInactive(false);
    } else {
      this.scoreboardEntity.setActive(false);
    }

    if (matchState === MatchStateType.Countdown) {
      this.ballEntity.setInactive(true);
      this.localCarEntity.setActive(false);
    }
  }

  public handleWaitingForPlayers(): void {
    this.gameState.setMatchState(MatchStateType.WaitingPlayers);
    this.scoreboardEntity.stopTimer();
  }

  public showCountdown(): void {
    const match = this.gameState.getMatch();
    const isHost = match?.isHost();

    this.gameState.setMatchState(MatchStateType.Countdown);

    this.resetForCountdown();

    if (isHost) {
      this.sendCountdownEvent();
    }

    if (this.countdownCurrentNumber >= 2) {
      const displayNumber = this.countdownCurrentNumber - 1;
      this.alertEntity.show([displayNumber.toString()], "#FFFF00");
    } else if (this.countdownCurrentNumber === 1) {
      this.alertEntity.show(["GO!"], "#FFFF00");
    } else {
      return this.handleCountdownEnd();
    }

    this.countdownCurrentNumber -= 1;

    if (isHost) {
      this.timerManagerService.createTimer(1, this.showCountdown.bind(this));
    }
  }

  public handleRemoteCountdown(arrayBuffer: ArrayBuffer | null): void {
    if (arrayBuffer === null) {
      console.warn("Array buffer is null");
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      console.warn("Host should not receive countdown event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.countdownCurrentNumber = binaryReader.unsignedInt8();
    this.showCountdown();
  }

  public handleGoalTimeEnd(): void {
    if (this.scoreboardEntity.hasTimerFinished() === true) {
      return;
    }

    this.countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;
    this.showCountdown();
  }

  public handleGameOverEnd(): void {
    console.log("Game over end");
    this.matchmakingService.handleGameOver();
  }

  private resetForCountdown(): void {
    this.ballEntity.reset();
    this.localCarEntity.reset();
  }

  private handleCountdownEnd(): void {
    console.log("Countdown end");
    this.gameState.startMatch();

    this.alertEntity.hide();
    this.localCarEntity.reset();
    this.ballEntity.reset();
    this.scoreboardEntity.startTimer();
  }

  private sendCountdownEvent(): void {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(this.countdownCurrentNumber)
      .toArrayBuffer();

    const countdownEvent = new RemoteEvent(EventType.Countdown);
    countdownEvent.setData(arrayBuffer);

    this.eventProcessorService.sendEvent(countdownEvent);
  }
}
