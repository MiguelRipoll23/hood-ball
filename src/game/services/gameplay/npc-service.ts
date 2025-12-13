import { NpcCarEntity } from "../../entities/npc-car-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { SpawnPointService } from "./spawn-point-service.js";
import { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import type { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import type { TimerServiceContract } from "../../../engine/interfaces/services/gameplay/timer-service-interface.js";

export class NpcService {
  private npcCarEntity: NpcCarEntity | null = null;
  private readonly INITIAL_IDLE_DELAY = 3; // 3 seconds before NPC starts moving
  private idleTimer: TimerServiceContract | null = null;

  constructor(
    private readonly matchSessionService: MatchSessionService,
    private readonly spawnPointService: SpawnPointService,
    private readonly timerManagerService: TimerManagerService
  ) {}

  public addNpcCar(
    canvas: HTMLCanvasElement,
    ballEntity: BallEntity,
    spawnPointEntities: SpawnPointEntity[],
    onEntityAdded: (entity: NpcCarEntity) => void
  ): NpcCarEntity | null {
    // Get available spawn point
    const spawnPointIndex =
      this.spawnPointService.getAndConsumeSpawnPointIndex();
    if (spawnPointIndex === -1) {
      console.warn("No spawn points available for NPC");
      return null;
    }

    const spawnPoint = spawnPointEntities.find(
      (sp) => sp.getIndex() === spawnPointIndex
    );
    if (!spawnPoint) {
      console.warn(`Spawn point ${spawnPointIndex} not found`);
      this.spawnPointService.releaseSpawnPointIndex(spawnPointIndex);
      return null;
    }

    const spawnX = spawnPoint.getX();
    const spawnY = spawnPoint.getY();

    // Create NPC car entity
    this.npcCarEntity = new NpcCarEntity(
      spawnX,
      spawnY,
      Math.PI / 2, // Spawn angle (facing down toward goal)
      canvas,
      ballEntity,
      spawnPointIndex
    );

    // Add NPC player to match session so it appears in spawn point debug info
    const npcPlayer = this.npcCarEntity.getPlayer();
    if (npcPlayer) {
      const match = this.matchSessionService.getMatch();
      if (match) {
        match.addPlayer(npcPlayer);
        console.log("NPC player added to match");
      }
    }

    // Add entity to scene via callback
    onEntityAdded(this.npcCarEntity);

    console.log(`NPC car added at spawn point ${spawnPointIndex}`);
    return this.npcCarEntity;
  }

  public removeNpcCar(onEntityRemoved?: (entity: NpcCarEntity) => void): void {
    if (!this.npcCarEntity) {
      return;
    }

    // Clear idle timer if it exists
    if (this.idleTimer !== null) {
      this.idleTimer.stop(false);
      this.idleTimer = null;
    }

    // Remove NPC player from match to prevent crashes
    const npcPlayer = this.npcCarEntity.getPlayer();
    if (npcPlayer) {
      const match = this.matchSessionService.getMatch();
      if (match) {
        match.removePlayer(npcPlayer);
        console.log("NPC player removed from match");
      }

      // Release the spawn point back to the pool
      const spawnIndex = npcPlayer.getSpawnPointIndex();
      if (spawnIndex !== -1) {
        this.spawnPointService.releaseSpawnPointIndex(spawnIndex);
      }
    }

    // Remove entity from scene via callback if provided
    onEntityRemoved?.(this.npcCarEntity);

    this.npcCarEntity = null;
    console.log("NPC car removed");
  }

  public activateNpcCarAfterDelay(boostPadsEntities: BoostPadEntity[]): void {
    if (!this.npcCarEntity) {
      return;
    }

    // Clear any existing timer
    if (this.idleTimer !== null) {
      this.idleTimer.stop(false);
    }

    // NPC stays idle for 3 seconds before activating
    this.idleTimer = this.timerManagerService.createTimer(
      this.INITIAL_IDLE_DELAY,
      () => {
        this.activateNpcCar(boostPadsEntities);
        this.idleTimer = null;
      }
    );

    console.log("NPC car will activate after 3 seconds");
  }

  public activateNpcCar(boostPadsEntities: BoostPadEntity[]): void {
    if (!this.npcCarEntity) {
      return;
    }

    // Pass boost pad information to NPC
    const boostPadsInfo = boostPadsEntities.map((pad) => ({
      x: pad.getX(),
      y: pad.getY(),
      consumed: !pad.isActive(), // Boost pad is consumed if not active
    }));
    this.npcCarEntity.setBoostPads(boostPadsInfo);

    // Activate NPC AI
    this.npcCarEntity.setActive(true);
    console.log("NPC car activated");
  }

  public deactivateNpcCar(): void {
    if (!this.npcCarEntity) {
      return;
    }

    // Clear idle timer if it exists
    if (this.idleTimer !== null) {
      this.idleTimer.stop(false);
      this.idleTimer = null;
    }

    // Deactivate NPC AI
    this.npcCarEntity.setActive(false);
  }

  public moveNpcToSpawn(spawnPointEntities: SpawnPointEntity[]): void {
    if (!this.npcCarEntity) {
      return;
    }

    const npcPlayer = this.npcCarEntity.getPlayer();
    if (!npcPlayer) {
      return;
    }

    const spawnIndex = npcPlayer.getSpawnPointIndex();
    const spawnPoint = spawnPointEntities.find(
      (sp) => sp.getIndex() === spawnIndex
    );

    if (spawnPoint) {
      const spawnX = spawnPoint.getX();
      const spawnY = spawnPoint.getY();
      this.npcCarEntity.teleport(spawnX, spawnY, Math.PI / 2);
      // Reset NPC boost level
      this.npcCarEntity.refillBoost();
      console.log(`NPC moved to spawn point ${spawnIndex} and boost refilled`);
    }
  }

  public getNpcCarEntity(): NpcCarEntity | null {
    return this.npcCarEntity;
  }

  public hasNpc(): boolean {
    return this.npcCarEntity !== null;
  }
}
