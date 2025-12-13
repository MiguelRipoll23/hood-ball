import { injectable } from "@needle-di/core";

@injectable()
export class SpawnPointService {
  private totalSpawnPoints = 0;
  private availableSpawnPointIndexes = new Set<number>();

  public getTotalSpawnPoints(): number {
    return this.totalSpawnPoints;
  }

  public setTotalSpawnPoints(total: number): void {
    if (!Number.isInteger(total) || total <= 0) {
      throw new Error("totalSpawnPoints must be a positive integer.");
    }

    this.totalSpawnPoints = total;
    this.availableSpawnPointIndexes = new Set(
      Array.from({ length: total }, (_, i) => i)
    );
  }

  public getAndConsumeSpawnPointIndex(): number {
    if (this.availableSpawnPointIndexes.size === 0) {
      // -1 indicates that no spawn points are currently available
      return -1;
    }

    // Get the lowest available index
    const index = Math.min(...this.availableSpawnPointIndexes);

    this.availableSpawnPointIndexes.delete(index);

    return index;
  }

  public releaseSpawnPointIndex(index: number): void {
    this.validateIndex(index);

    if (this.availableSpawnPointIndexes.has(index)) {
      console.warn(`Spawn point ${index} is already available`);
      return;
    }

    this.availableSpawnPointIndexes.add(index);
    console.debug(`Spawn point ${index} released`);
  }

  public isSpawnPointAvailable(index: number): boolean {
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
