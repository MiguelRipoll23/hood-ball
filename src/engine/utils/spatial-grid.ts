/**
 * SpatialGrid — A fixed-size spatial partitioning grid that bins entities
 * by (x, y) position so collision detection can skip distant pairs.
 *
 * Reduces collision detection from O(n²) brute-force to O(n) in typical
 * cases by only checking entities in the same or adjacent cells.
 */
export class SpatialGrid<T extends { getX: () => number; getY: () => number }> {
  private readonly cells = new Map<number, T[]>();

  constructor(
    private readonly cellSize: number,
    private readonly gridWidth: number,
    private readonly gridHeight: number,
  ) {}

  /** Hash a cell coordinate pair into a single integer key. */
  private cellKey(cx: number, cy: number): number {
    return cy * this.gridWidth + cx;
  }

  /** Return the cell coordinates for a world position. */
  private cellCoords(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x / this.cellSize))),
      cy: Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y / this.cellSize))),
    };
  }

  /** Clear all cells. Call once per frame before inserting entities. */
  public clear(): void {
    this.cells.clear();
  }

  /** Insert an entity into the appropriate cell. */
  public insert(entity: T): void {
    const { cx, cy } = this.cellCoords(entity.getX(), entity.getY());
    const key = this.cellKey(cx, cy);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(entity);
  }

  /**
   * Invoke `callback` for every pair (a, b) where a and b are in the same
   * or adjacent cells. Each unique pair is visited exactly once.
   */
  public forEachPair(callback: (a: T, b: T) => void): void {
    const visited = new Set<number>();

    for (const [key, bucket] of this.cells) {
      const cy = Math.floor(key / this.gridWidth);
      const cx = key % this.gridWidth;

      // Within the same cell
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) {
          callback(bucket[i], bucket[j]);
        }
      }

      // Adjacent cells: right, bottom-right, bottom, bottom-left
      const neighbors = [
        [cx + 1, cy],
        [cx + 1, cy + 1],
        [cx, cy + 1],
        [cx - 1, cy + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) continue;
        const nKey = this.cellKey(nx, ny);
        const neighborBucket = this.cells.get(nKey);
        if (!neighborBucket) continue;

        // Avoid processing the same neighbor pair twice
        const pairId = Math.min(key, nKey) * this.gridWidth * this.gridHeight + Math.max(key, nKey);
        if (visited.has(pairId)) continue;
        visited.add(pairId);

        for (const a of bucket) {
          for (const b of neighborBucket) {
            callback(a, b);
          }
        }
      }
    }
  }
}
