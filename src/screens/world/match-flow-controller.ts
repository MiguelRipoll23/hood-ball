import { BinaryReader } from "../../utils/binary-reader-utils.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import { RemoteEvent } from "../../models/remote-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { GameState } from "../../models/game-state.js";
import { TimerManagerService } from "../../services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../services/gameplay/event-processor-service.js";
import type { IMatchmakingProvider } from "../../interfaces/services/gameplay/matchmaking-provider.js";
import { ScoreboardObject } from "../../objects/scoreboard-object.js";
import { BallObject } from "../../objects/ball-object.js";
import { LocalCarObject } from "../../objects/local-car-object.js";
import { AlertObject } from "../../objects/alert-object.js";

export class MatchFlowController {
  private readonly COUNTDOWN_START_NUMBER = 4;
  private countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;

  constructor(
    private readonly gameState: GameState,
    private readonly timerManagerService: TimerManagerService,
    private readonly eventProcessorService: EventProcessorService,
    private readonly matchmakingService: IMatchmakingProvider,
    private readonly scoreboardObject: ScoreboardObject,
    private readonly ballObject: BallObject,
    private readonly localCarObject: LocalCarObject,
    private readonly alertObject: AlertObject
  ) {}

  public handleMatchState(): void {
    const matchState = this.gameState.getMatch()?.getState();

    if (matchState === MatchStateType.InProgress) {
      this.localCarObject.setActive(true);
      this.scoreboardObject.setActive(true);
      this.ballObject.setInactive(false);
    } else {
      this.scoreboardObject.setActive(false);
    }

    if (matchState === MatchStateType.Countdown) {
      this.ballObject.setInactive(true);
      this.localCarObject.setActive(false);
    }
  }

  public handleWaitingForPlayers(): void {
    this.gameState.setMatchState(MatchStateType.WaitingPlayers);
    this.scoreboardObject.stopTimer();
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
      this.alertObject.show([displayNumber.toString()], "#FFFF00");
    } else if (this.countdownCurrentNumber === 1) {
      this.alertObject.show(["GO!"], "#FFFF00");
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
      return console.warn("Array buffer is null");
    }

    if (this.gameState.getMatch()?.isHost()) {
      return console.warn("Host should not receive countdown event");
    }

    const binaryReader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.countdownCurrentNumber = binaryReader.unsignedInt8();
    this.showCountdown();
  }

  public handleGoalTimeEnd(): void {
    if (this.scoreboardObject.hasTimerFinished() === true) {
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
    this.ballObject.reset();
    this.localCarObject.reset();
  }

  private handleCountdownEnd(): void {
    console.log("Countdown end");
    this.gameState.startMatch();

    this.alertObject.hide();
    this.localCarObject.reset();
    this.ballObject.reset();
    this.scoreboardObject.startTimer();
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
