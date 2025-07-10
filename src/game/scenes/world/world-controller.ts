import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import { RemoteEvent } from "../../../core/models/remote-event.js";
import { EventType } from "../../enums/event-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import type { GameState } from "../../../core/models/game-state.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../core/services/gameplay/event-processor-service.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import { CarEntity } from "../../entities/car-entity.js";
import type { GameEntity } from "../../../core/models/game-entity.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { BaseMultiplayerGameEntity } from "../../../core/entities/base-multiplayer-entity.js";
import type { CarDemolishedPayload } from "../../interfaces/events/car-demolished-payload.js";
import type { IMatchmakingService } from "../../interfaces/services/gameplay/matchmaking-service-interface.js";
import type { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";

export class WorldController {
  private readonly COUNTDOWN_START_NUMBER = 4;
  private countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;

  constructor(
    private readonly gameState: GameState,
    private readonly spawnPointService: SpawnPointService,
    private readonly timerManagerService: TimerManagerService,
    private readonly eventProcessorService: EventProcessorService,
    private readonly matchmakingService: IMatchmakingService,
    private readonly scoreboardEntity: ScoreboardEntity,
    private readonly ballEntity: BallEntity,
    private readonly localCarEntity: LocalCarEntity,
    private readonly alertEntity: AlertEntity,
  private readonly boostPadsEntities: BoostPadEntity[],
  private readonly spawnPointEntities: SpawnPointEntity[]
  ) {
    this.assignInitialSpawnPoint();
    this.moveCarToSpawnPoint();
  }

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
    this.moveCarToSpawnPoint();
    this.localCarEntity.refillBoost();
    this.boostPadsEntities.forEach((pad) => pad.reset());
  }

  private handleCountdownEnd(): void {
    console.log("Countdown end");
    this.gameState.startMatch();

    this.alertEntity.hide();
    this.localCarEntity.reset();
    this.moveCarToSpawnPoint();
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

  private assignInitialSpawnPoint(): void {
    const spawnPointIndex =
      this.spawnPointService.getAndConsumeSpawnPointIndex();

    const gamePlayer = this.gameState.getGamePlayer();
    if (spawnPointIndex === -1) {
      console.warn("No spawn points available for local player");
      return;
    }

    gamePlayer.setSpawnPointIndex(spawnPointIndex);

    this.updateLocalCarPosition(spawnPointIndex);
  }

  private moveCarToSpawnPoint(): void {
    const gamePlayer = this.gameState.getGamePlayer();
    const spawnPointIndex = gamePlayer.getSpawnPointIndex();

    if (spawnPointIndex === -1) {
      console.warn("Local player does not have a spawn point index");
      return;
    }

    this.updateLocalCarPosition(spawnPointIndex);
  }

  private updateLocalCarPosition(spawnPointIndex: number): void {
    this.spawnPointEntities.forEach((spawnPoint) => {
      if (spawnPoint.getIndex() === spawnPointIndex) {
        const x = spawnPoint.getX();
        const y = spawnPoint.getY();
        this.localCarEntity.setX(x);
        this.localCarEntity.setY(y);
      }
    });
  }

  public handleRemoteCarDemolished(
    data: ArrayBuffer | null,
    getEntitiesByOwner: (player: GamePlayer) => BaseMultiplayerGameEntity[],
    triggerCarExplosion: (x: number, y: number) => void
  ): void {
    if (data === null) {
      console.warn("Array buffer is null");
      return;
    }

    if (this.gameState.getMatch()?.isHost()) {
      console.warn("Host should not receive car demolished event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(data);
    const payload: CarDemolishedPayload = {
      attackerId: binaryReader.fixedLengthString(32),
      victimId: binaryReader.fixedLengthString(32),
    };

    const attacker =
      this.gameState.getMatch()?.getPlayer(payload.attackerId) ?? null;
    const victim = this.gameState.getMatch()?.getPlayer(payload.victimId) ?? null;

    if (!victim) {
      console.warn(`Cannot find victim with id ${payload.victimId}`);
      return;
    }

    const victimCar = getEntitiesByOwner(victim).find(
      (e): e is CarEntity => e instanceof CarEntity
    );

    if (!victimCar) {
      console.warn(`Cannot find car for victim ${payload.victimId}`);
      return;
    }

    const spawn = this.getSpawnPoint(victim);
    if (spawn) {
      victimCar.demolish(spawn.x, spawn.y, 3000);
    }
    triggerCarExplosion(victimCar.getX(), victimCar.getY());

    const attackerName = attacker?.getName() ?? "Unknown";
    const victimName = victim.getName();
    const attackerColor = this.getPlayerColor(attacker);
    const victimColor = this.getPlayerColor(victim);
    this.alertEntity.showColored(
      [attackerName, "\uD83D\uDCA3", victimName],
      [attackerColor, "white", victimColor],
      2
    );
  }

  public handleCarDemolitions(
    worldEntities: GameEntity[],
    triggerCarExplosion: (x: number, y: number) => void
  ): void {
    if (!this.gameState.getMatch()?.isHost()) {
      return;
    }

    const cars = worldEntities.filter(
      (e): e is CarEntity => e instanceof CarEntity
    );

    cars.forEach((car) => {
      car.getCollidingEntities().forEach((other) => {
        if (!(other instanceof CarEntity)) {
          return;
        }

        if (car.isDemolished() || other.isDemolished()) {
          return;
        }

        const maxSpeed =
          car.getTopSpeed() * car.getBoostTopSpeedMultiplier();
        const EPSILON = 0.001;
        const carAtMax =
          car.isBoosting() && car.getSpeed() >= maxSpeed - EPSILON;

        if (carAtMax) {
          const victim = other;
          const attacker = car;
          const spawn = this.getSpawnPoint(victim.getPlayer());
          if (spawn) {
            victim.demolish(spawn.x, spawn.y, 3000);
          }
          triggerCarExplosion(victim.getX(), victim.getY());

          const attackerName = attacker.getPlayer()?.getName() ?? "Unknown";
          const victimName = victim.getPlayer()?.getName() ?? "Unknown";
          const attackerColor = this.getPlayerColor(attacker.getPlayer());
          const victimColor = this.getPlayerColor(victim.getPlayer());
          this.alertEntity.showColored(
            [attackerName, "\uD83D\uDCA3", victimName],
            [attackerColor, "white", victimColor],
            2
          );

          const attackerPlayer = attacker.getPlayer();
          const victimPlayer = victim.getPlayer();
          if (attackerPlayer && victimPlayer) {
            const payload = BinaryWriter.build()
              .fixedLengthString(attackerPlayer.getId(), 32)
              .fixedLengthString(victimPlayer.getId(), 32)
              .toArrayBuffer();

            const event = new RemoteEvent(EventType.CarDemolished);
            event.setData(payload);
            this.eventProcessorService.sendEvent(event);
          }
        }
      });
    });
  }

  private getSpawnPoint(player: GamePlayer | null): { x: number; y: number } | null {
    if (!player) {
      return null;
    }

    const index = player.getSpawnPointIndex();
    const spawn = this.spawnPointEntities.find((s) => s.getIndex() === index);
    if (!spawn) {
      return null;
    }
    return { x: spawn.getX(), y: spawn.getY() };
  }

  private getPlayerColor(player: GamePlayer | null): string {
    if (!player) {
      return "white";
    }

    return player === this.gameState.getGamePlayer() ? "blue" : "red";
  }
}
