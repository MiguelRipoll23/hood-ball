import { injectable } from "@needle-di/core";

@injectable()
export class SpawnPointService {
  private totalSpawnPoints = 0;
  private availableSpawnPointIndexes = new Set<number>();
  private consumedSpawnPointIndexes = new Set<number>();

  public getTotalSpawnPoints(): number {
    return this.totalSpawnPoints;
  }

  public setTotalSpawnPoints(
    total: number,
    usedIndexes: Iterable<number> = []
  ): void {
    if (!Number.isInteger(total) || total <= 0) {
      throw new Error("totalSpawnPoints must be a positive integer.");
    }

    const previouslyConsumed = Array.from(this.consumedSpawnPointIndexes);

    this.totalSpawnPoints = total;
    this.availableSpawnPointIndexes = new Set(
      Array.from({ length: total }, (_, i) => i)
    );

    const normalizedConsumed = new Set<number>();
    const indexesToReserve = [
      ...previouslyConsumed,
      ...Array.from(usedIndexes ?? []),
    ];

    indexesToReserve.forEach((index) => {
      if (!Number.isInteger(index)) {
        return;
      }

      if (index < 0 || index >= this.totalSpawnPoints) {
        console.warn(
          `Ignoring spawn point index ${index} outside the configured range`
        );
        return;
      }

      if (this.availableSpawnPointIndexes.delete(index)) {
        normalizedConsumed.add(index);
      }
    });

    this.consumedSpawnPointIndexes = normalizedConsumed;

    console.log("[SpawnPointService] Initialized", {
      total,
      reserved: Array.from(this.consumedSpawnPointIndexes),
      available: Array.from(this.availableSpawnPointIndexes),
    });
  }

  public getAndConsumeSpawnPointIndex(): number {
    if (this.availableSpawnPointIndexes.size === 0) {
      console.log("[SpawnPointService] No available spawn points to consume");
      // -1 indicates that no spawn points are currently available
      return -1;
    }

    const iterator = this.availableSpawnPointIndexes.values().next();
    if (iterator.done) {
      return -1;
    }

    const index = iterator.value;
    this.availableSpawnPointIndexes.delete(index);
    this.consumedSpawnPointIndexes.add(index);

    console.log("[SpawnPointService] Consumed", {
      index,
      remaining: Array.from(this.availableSpawnPointIndexes),
    });

    return index;
  }

  public consumeSpawnPointIndex(index: number): boolean {
    if (!Number.isInteger(index)) {
      console.warn(`Invalid spawn point index: ${index}`);
      return false;
    }

    if (this.totalSpawnPoints === 0) {
      const wasAdded = !this.consumedSpawnPointIndexes.has(index);
      this.consumedSpawnPointIndexes.add(index);
      console.log("[SpawnPointService] Pre-init reservation", {
        index,
        wasAdded,
      });
      return wasAdded;
    }

    if (!Number.isInteger(index) || index < 0 || index >= this.totalSpawnPoints) {
      console.warn(`Invalid spawn point index: ${index}`);
      return false;
    }

    if (this.consumedSpawnPointIndexes.has(index)) {
      console.log("[SpawnPointService] Index already consumed", { index });
      return false;
    }

    const wasAvailable = this.availableSpawnPointIndexes.delete(index);

    if (!wasAvailable) {
      console.log("[SpawnPointService] Index not available", { index });
      return false;
    }

    this.consumedSpawnPointIndexes.add(index);
    console.log("[SpawnPointService] Reserved", {
      index,
      remaining: Array.from(this.availableSpawnPointIndexes),
    });
    return true;
  }

  public releaseSpawnPointIndex(index: number): void {
    if (this.totalSpawnPoints === 0) {
      this.consumedSpawnPointIndexes.delete(index);
      console.log("[SpawnPointService] Pre-init release", { index });
      return;
    }

    this.validateIndex(index);

    if (this.availableSpawnPointIndexes.has(index)) {
      console.warn(`Spawn point ${index} is already available`);
      return;
    }

    this.availableSpawnPointIndexes.add(index);
    this.consumedSpawnPointIndexes.delete(index);
    console.debug(`Spawn point ${index} released`);
  }

  public isSpawnPointAvailable(index: number): boolean {
    if (this.totalSpawnPoints === 0) {
      return false;
    }

    this.validateIndex(index);
    return this.availableSpawnPointIndexes.has(index);
  }

  public getAvailableSpawnPoints(): number[] {
    return Array.from(this.availableSpawnPointIndexes);
  }

  private validateIndex(index: number): void {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.totalSpawnPoints
    ) {
      throw new Error(`Invalid spawn point index: ${index}`);
    }
  }
}
