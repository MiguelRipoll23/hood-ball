import { injectable } from "@needle-di/core";
import type { Match } from "@game/models/match.js";
import type { SpawnPointService } from "./spawn-point-service.js";
import type { GamePlayer } from "@game/models/game-player.js";

export type SpawnAllocationResult = {
  index: number;
  fallback: boolean;
};

@injectable()
export class PlayerAssignmentService {
  public allocateSpawnPoint(
    match: Match,
    spawnPointService: SpawnPointService
  ): SpawnAllocationResult {
    let spawnPointIndex = spawnPointService.getAndConsumeSpawnPointIndex();
    let usedFallback = false;

    if (
      spawnPointIndex === -1 ||
      this.isSpawnPointAlreadyUsed(match, spawnPointIndex)
    ) {
      spawnPointIndex = this.allocateFallbackSpawnPoint(
        match,
        spawnPointService
      );
      usedFallback = spawnPointIndex !== -1;
    }

    return {
      index: spawnPointIndex,
      fallback: usedFallback,
    };
  }

  public applySpawnPoint(player: GamePlayer, index: number): void {
    if (index !== -1) {
      player.setSpawnPointIndex(index);
    }
  }

  private allocateFallbackSpawnPoint(
    match: Match,
    spawnPointService: SpawnPointService
  ): number {
    const fallbackIndex = this.findFallbackSpawnPointIndex(
      match,
      spawnPointService
    );

    if (fallbackIndex === -1) {
      return -1;
    }

    const reserved = spawnPointService.consumeSpawnPointIndex(fallbackIndex);

    if (!reserved) {
      console.warn(
        `Spawn point ${fallbackIndex} could not be reserved for joining player`
      );
      return -1;
    }

    console.log("[PlayerAssignmentService] Fallback spawn reserved", {
      index: fallbackIndex,
    });

    return fallbackIndex;
  }

  private findFallbackSpawnPointIndex(
    match: Match,
    spawnPointService: SpawnPointService
  ): number {
    const usedIndexes = new Set<number>();

    match.getPlayers().forEach((player) => {
      const index = player.getSpawnPointIndex();
      if (Number.isInteger(index)) {
        usedIndexes.add(index);
      }
    });

    const totalSpawnPoints = spawnPointService.getTotalSpawnPoints();

    if (totalSpawnPoints > 0) {
      for (let index = 0; index < totalSpawnPoints; index += 1) {
        if (!usedIndexes.has(index)) {
          return index;
        }
      }

      return -1;
    }

    let fallbackIndex = 0;

    while (usedIndexes.has(fallbackIndex)) {
      fallbackIndex += 1;
    }

    console.log(
      "[PlayerAssignmentService] Fallback index computed outside configured range",
      { index: fallbackIndex }
    );

    return fallbackIndex;
  }

  private isSpawnPointAlreadyUsed(match: Match, index: number): boolean {
    if (!Number.isInteger(index) || index < 0) {
      return true;
    }

    return match
      .getPlayers()
      .some((player) => player.getSpawnPointIndex() === index);
  }
}
