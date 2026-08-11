import { BinaryReader } from "../../../engine/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../../engine/utils/binary-writer-utils.js";
import { RemoteEvent } from "../../../engine/models/remote-event.js";
import { LocalEvent } from "../../../engine/models/local-event.js";
import { GameEventType } from "../../enums/event-type.js";
import { MatchStateType } from "../../enums/match-state-type.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import { CarEntity } from "../../entities/car-entity.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { SPAWN_ANGLE } from "../../constants/entity-constants.js";
import type { GameEntity } from "../../../engine/models/game-entity.js";
import { MatchAction } from "../../models/match-action.js";
import type { MultiplayerGameEntity } from "../../../engine/interfaces/entities/multiplayer-game-entity-interface.js";
import type { CarDemolishedPayload } from "../../interfaces/events/car-demolished-payload-interface.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { MatchSessionService } from "../../services/session/match-session-service.js";
import type { NpcService } from "../../services/gameplay/npc-service.js";
import type { WorldControllerDependencies } from "./world-controller-dependencies.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

export class WorldController {
  private readonly COUNTDOWN_START_NUMBER = 4;
  private countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;
  private readonly gamePlayer: GamePlayer;
  private readonly matchSessionService: MatchSessionService;
  private readonly spawnPointService: SpawnPointService;
  private readonly timerManagerService: TimerManagerService;
  private readonly eventProcessorService: EventProcessorService;
  private readonly matchmakingService: MatchmakingServiceContract;
  private readonly scoreboardEntity: ScoreboardEntity;
  private readonly ballEntity: BallEntity;
  private readonly localCarEntity: LocalCarEntity;
  private readonly alertEntity: AlertEntity;
  private readonly matchActionsLogService: MatchActionsLogService;
  private readonly boostPadsEntities: BoostPadEntity[];
  private readonly spawnPointEntities: SpawnPointEntity[];
  private readonly getEntitiesByOwner: (
    player: GamePlayer
  ) => MultiplayerGameEntity[];
  private readonly npcService: NpcService;
  private isSoloMatchWithNpc = false;

  constructor(deps: WorldControllerDependencies) {
    const {
      spawnPointService,
      timerManagerService,
      eventProcessorService,
      matchmakingService,
      scoreboardEntity,
      ballEntity,
      localCarEntity,
      alertEntity,
      matchActionsLogService,
      boostPadsEntities,
      spawnPointEntities,
      getEntitiesByOwner,
      npcService,
      gamePlayer,
      matchSessionService,
    } = deps;
    this.spawnPointService = spawnPointService;
    this.timerManagerService = timerManagerService;
    this.eventProcessorService = eventProcessorService;
    this.matchmakingService = matchmakingService;
    this.scoreboardEntity = scoreboardEntity;
    this.ballEntity = ballEntity;
    this.localCarEntity = localCarEntity;
    this.alertEntity = alertEntity;
    this.matchActionsLogService = matchActionsLogService;
    this.boostPadsEntities = boostPadsEntities;
    this.spawnPointEntities = spawnPointEntities;
    this.getEntitiesByOwner = getEntitiesByOwner;
    this.npcService = npcService;
    this.gamePlayer = gamePlayer;
    this.matchSessionService = matchSessionService;
    this.assignInitialSpawnPoint();
    this.moveCarToSpawnPoint();

    // Ensure ball has owner if we are host
    if (this.matchSessionService.getMatch()?.isHost()) {
      this.ballEntity.setOwner(this.gamePlayer);
    }
  }

  public handleMatchState(): void {
    const matchState = this.matchSessionService.getMatch()?.getState();

    if (matchState === MatchStateType.InProgress) {
      this.localCarEntity.setActive(true);
      // Don't call setActive on scoreboard - timer state is managed by startTimer/stopTimer
      // in handleCountdownEnd and goal scoring
      this.ballEntity.setInactive(false);
    }

    if (matchState === MatchStateType.Countdown) {
      this.ballEntity.setInactive(true);
      this.localCarEntity.setActive(false);
      // Deactivate NPC during countdown
      this.npcService.deactivateNpcCar();
    }
  }

  public startSoloMatchWithNpc(
    canvas: HTMLCanvasElement,
    onEntityAdded: (entity: any) => void
  ): void {
    this.isSoloMatchWithNpc = true;
    this.npcService.addNpcCar(
      canvas,
      this.ballEntity,
      this.spawnPointEntities,
      onEntityAdded
    );
    EngineLogger.info("WorldController", "Solo match with NPC started");
  }

  public showCountdown(): void {
    const match = this.matchSessionService.getMatch();
    const isHost = match?.isHost();
    const playersCount = match?.getPlayers().length ?? 0;

    this.matchSessionService.setMatchState(MatchStateType.Countdown);

    // Remove NPC car and reset scores when transitioning from solo to multiplayer
    // (when second player joins - player count is now 2)
    // Note: NPC player is already removed from match by matchmaking service before spawn assignment
    if (this.isSoloMatchWithNpc && playersCount >= 2) {
      // Clear ball's lastPlayer reference if it's the NPC
      const npcPlayer = this.npcService.getNpcCarEntity()?.getPlayer();
      if (npcPlayer) {
        this.ballEntity.clearLastPlayerIfMatches(npcPlayer);
      }

      // Remove NPC car entity from scene (player already removed from match)
      this.npcService.removeNpcCar();
      this.isSoloMatchWithNpc = false;

      // Reset scores when transitioning from solo match to real match
      const players = this.matchSessionService.getMatch()?.getPlayers() ?? [];
      players.forEach((player) => {
        player.setScore(0);
      });

      // Reset countdown to start fresh for real match
      this.countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;

      EngineLogger.info("WorldController", 
        "Transitioning from solo to multiplayer - NPC entity removed, scores reset, countdown restarted"
      );
    }

    if (this.countdownCurrentNumber < 0) {
      this.countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;
    }

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
      EngineLogger.warn("WorldController", "Array buffer is null");
      return;
    }

    if (this.matchSessionService.getMatch()?.isHost()) {
      EngineLogger.warn("WorldController", "Host should not receive countdown event");
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

    // During solo play, skip countdown and restart immediately
    if (this.isSoloMatchWithNpc) {
      this.resetForSoloGoal();
      this.matchSessionService.setMatchState(MatchStateType.InProgress);
      // Reactivate NPC after goal
      this.npcService.activateNpcCar(this.boostPadsEntities);
    } else {
      this.countdownCurrentNumber = this.COUNTDOWN_START_NUMBER;
      this.showCountdown();
    }
  }

  private resetForSoloGoal(): void {
    // Reset ball and move players to spawn points
    this.ballEntity.reset();
    this.localCarEntity.reset();
    this.moveCarToSpawnPoint();
    // Reset boost levels
    this.localCarEntity.refillBoost();
    // Move NPC to spawn and reset its boost
    this.npcService.moveNpcToSpawn(this.spawnPointEntities);
    // Reset boost pads
    this.boostPadsEntities.forEach((pad) => pad.reset());
  }

  public startSoloMatchImmediately(): void {
    // Skip countdown for solo play - start match directly
    this.resetForCountdown();
    this.handleCountdownEnd();
  }

  public handleGameOverEnd(): void {
    EngineLogger.info("WorldController", "Game over end");
    this.matchmakingService.handleGameOver();
  }

  private resetForCountdown(): void {
    this.ballEntity.reset();
    this.localCarEntity.reset();
    this.moveCarToSpawnPoint();
    this.markRemoteCarsForSpawn();
    this.localCarEntity.refillBoost();
    this.boostPadsEntities.forEach((pad) => pad.reset());

    // Move NPC to spawn point if in solo match
    if (this.isSoloMatchWithNpc) {
      this.npcService.moveNpcToSpawn(this.spawnPointEntities);
    }
  }

  private handleCountdownEnd(): void {
    EngineLogger.info("WorldController", "Countdown end");
    this.matchSessionService.startMatch();

    this.alertEntity.hide();
    this.localCarEntity.reset();
    this.moveCarToSpawnPoint();
    this.markRemoteCarsForSpawn();
    this.ballEntity.reset();

    // Only start timer if it's not a solo match with NPC
    // In solo matches, timer stays frozen at initial duration
    if (!this.isSoloMatchWithNpc) {
      this.scoreboardEntity.startTimer();
      EngineLogger.info("WorldController", "Real match - timer started");
    } else {
      EngineLogger.info("WorldController", "Solo match - timer remains frozen");
      // Activate NPC AI after 3-second delay
      this.npcService.activateNpcCarAfterDelay(this.boostPadsEntities);
    }
  }

  private sendCountdownEvent(): void {
    const arrayBuffer = BinaryWriter.build()
      .unsignedInt8(this.countdownCurrentNumber)
      .toArrayBuffer();

    const countdownEvent = new RemoteEvent(GameEventType.Countdown);
    countdownEvent.setData(arrayBuffer);

    this.eventProcessorService.sendEvent(countdownEvent);
  }

  private assignInitialSpawnPoint(): void {
    const spawnPointIndex =
      this.spawnPointService.getAndConsumeSpawnPointIndex();

    const gamePlayer = this.gamePlayer;
    if (spawnPointIndex === -1) {
      EngineLogger.warn("WorldController", "No spawn points available for local player");
      return;
    }

    gamePlayer.setSpawnPointIndex(spawnPointIndex);

    this.updateLocalCarPosition(spawnPointIndex);
  }

  private moveCarToSpawnPoint(): void {
    const gamePlayer = this.gamePlayer;
    const spawnPointIndex = gamePlayer.getSpawnPointIndex();

    if (spawnPointIndex === -1) {
      EngineLogger.warn("WorldController", "Local player does not have a spawn point index");
      return;
    }

    EngineLogger.info("WorldController", 
      "Moving local car to spawn point index",
      gamePlayer,
      spawnPointIndex
    );

    this.updateLocalCarPosition(spawnPointIndex);
  }

  private updateLocalCarPosition(spawnPointIndex: number): void {
    this.spawnPointEntities.forEach((spawnPoint) => {
      if (spawnPoint.getIndex() === spawnPointIndex) {
        const x = spawnPoint.getX();
        const y = spawnPoint.getY();
        // Use teleport instead of setX/setY + setSkipInterpolation
        this.localCarEntity.teleport(x, y, SPAWN_ANGLE);
      }
    });
  }

  private markRemoteCarsForSpawn(): void {
    const players = this.matchSessionService.getMatch()?.getPlayers() ?? [];
    players.forEach((player) => {
      if (player === this.gamePlayer) {
        return;
      }
      this.getEntitiesByOwner(player).forEach((entity) => {
        if (entity instanceof CarEntity) {
          // Use teleport method to ensure proper reset and frame-based skip
          const spawn = this.getSpawnPoint(player);
          if (spawn) {
            entity.teleport(spawn.x, spawn.y, SPAWN_ANGLE);
          } else {
            // Fallback: at least set skip interpolation
            EngineLogger.warn("WorldController", 
              `No spawn point found for player ${player.getName()}, skipping teleport`
            );
            entity.getComponent(TransformComponent)!.skipInterpolation = true;
          }
        }
      });
    });
  }

  public handleRemoteCarDemolished(
    data: ArrayBuffer | null,
    getEntitiesByOwner: (player: GamePlayer) => MultiplayerGameEntity[],
    triggerCarExplosion: (x: number, y: number) => void
  ): void {
    if (data === null) {
      EngineLogger.warn("WorldController", "Array buffer is null");
      return;
    }

    if (this.matchSessionService.getMatch()?.isHost()) {
      EngineLogger.warn("WorldController", "Host should not receive car demolished event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(data);
    const payload: CarDemolishedPayload = {
      attackerId: binaryReader.fixedLengthString(32),
      victimId: binaryReader.fixedLengthString(32),
    };

    const attacker =
      this.matchSessionService
        .getMatch()
        ?.getPlayerByNetworkId(payload.attackerId) ?? null;
    const victim =
      this.matchSessionService
        .getMatch()
        ?.getPlayerByNetworkId(payload.victimId) ?? null;

    if (!victim) {
      EngineLogger.warn("WorldController", `Cannot find victim with id ${payload.victimId}`);
      return;
    }

    const victimCar = getEntitiesByOwner(victim).find(
      (e) => e instanceof CarEntity
    ) as CarEntity | undefined;

    if (!victimCar) {
      EngineLogger.warn("WorldController", `Cannot find car for victim ${payload.victimId}`);
      return;
    }

    const spawn = this.getSpawnPoint(victim);
    if (spawn) {
      victimCar.demolish(spawn.x, spawn.y, 3000);
    }
    triggerCarExplosion(victimCar.getX(), victimCar.getY());

    this.logDemolition(
      payload.attackerId,
      payload.victimId,
      attacker?.getName() ?? null,
      victim.getName()
    );

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

  public handleRemoteBoostPadConsumed(
    data: ArrayBuffer | null,
    getEntitiesByOwner: (player: GamePlayer) => MultiplayerGameEntity[]
  ): void {
    if (data === null) {
      EngineLogger.warn("WorldController", "Array buffer is null");
      return;
    }

    if (this.matchSessionService.getMatch()?.isHost()) {
      EngineLogger.warn("WorldController", "Host should not receive boost pad event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(data);
    const index = binaryReader.unsignedInt8();
    const playerId = binaryReader.fixedLengthString(32);

    if (index < 0 || index >= this.boostPadsEntities.length) {
      EngineLogger.warn("WorldController", `Invalid boost pad index: ${index}`);
      return;
    }

    const pad = this.boostPadsEntities[index];
    pad.forceConsume();

    const player =
      this.matchSessionService.getMatch()?.getPlayerByNetworkId(playerId) ??
      null;
    if (player) {
      getEntitiesByOwner(player).forEach((entity) => {
        if (entity instanceof CarEntity) {
          entity.refillBoost();
        }
      });
    } else {
      EngineLogger.warn("WorldController", `Cannot find player with id ${playerId}`);
    }
  }

  public handleRemotePlayerBanned(data: ArrayBuffer | null): void {
    if (data === null) {
      EngineLogger.warn("WorldController", "Array buffer is null");
      return;
    }

    if (this.matchSessionService.getMatch()?.isHost()) {
      EngineLogger.warn("WorldController", "Host should not receive player banned event");
      return;
    }

    const binaryReader = BinaryReader.fromArrayBuffer(data);
    const playerId = binaryReader.fixedLengthString(32);

    const player =
      this.matchSessionService.getMatch()?.getPlayerByNetworkId(playerId) ??
      null;
    const playerName = player?.getName() ?? playerId;

    EngineLogger.info("WorldController", `Player banned: ${playerName} (${playerId})`);

    const action = MatchAction.playerBanned(playerId, {
      playerName,
    });

    this.matchActionsLogService.addAction(action);

    // If the local player is the banned player, navigate to login as a terminal state
    if (playerId === this.gamePlayer.getNetworkId()) {
      EngineLogger.info("WorldController", "Local player has been banned from this match");
      const localEvent = new LocalEvent(GameEventType.UserBannedByServer);
      this.eventProcessorService.addLocalEvent(localEvent);
    }
  }

  public handleCarDemolitions(
    worldEntities: GameEntity[],
    triggerCarExplosion: (x: number, y: number) => void
  ): void {
    if (!this.matchSessionService.getMatch()?.isHost()) {
      return;
    }

    const cars = worldEntities.filter(
      (e) => e instanceof CarEntity
    ) as CarEntity[];

    cars.forEach((car) => {
      car.getCollidingEntities().forEach((other) => {
        if (!(other instanceof CarEntity)) {
          return;
        }

        if (car.isDemolished() || other.isDemolished()) {
          return;
        }

        const maxSpeed = car.getTopSpeed() * car.getBoostTopSpeedMultiplier();
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
              .fixedLengthString(attackerPlayer.getNetworkId(), 32)
              .fixedLengthString(victimPlayer.getNetworkId(), 32)
              .toArrayBuffer();

            const event = new RemoteEvent(GameEventType.CarDemolished);
            event.setData(payload);

            this.eventProcessorService.sendEvent(event);

            this.logDemolition(
              attackerPlayer.getNetworkId(),
              victimPlayer.getNetworkId(),
              attackerPlayer.getName(),
              victimPlayer.getName()
            );
          }
        }
      });
    });
  }

  private getSpawnPoint(
    player: GamePlayer | null
  ): { x: number; y: number } | null {
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

    return player === this.gamePlayer ? "blue" : "red";
  }

  private logDemolition(
    attackerId: string,
    victimId: string,
    attackerName?: string | null,
    victimName?: string | null
  ): void {
    this.matchActionsLogService.addAction(
      MatchAction.demolition(attackerId, victimId, {
        attackerName: attackerName ?? null,
        victimName: victimName ?? null,
      })
    );
  }

  public isSoloMatch(): boolean {
    return this.isSoloMatchWithNpc;
  }
}
