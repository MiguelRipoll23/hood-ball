import { injectable } from "@needle-di/core";
import type { GamePlayer } from "../../models/game-player.js";

@injectable()
export class PlayerSpawnService {
  private assignedIndexes: Map<string, number> = new Map();
  private availableIndexes: number[] = [];
  private nextIndex = 0;

  public assignSpawnIndex(player: GamePlayer, index?: number): number {
    const id = player.getId();
    if (this.assignedIndexes.has(id)) {
      return this.assignedIndexes.get(id)!;
    }

    let assigned: number;
    if (index !== undefined) {
      assigned = index;
      // ensure nextIndex keeps increasing
      if (assigned >= this.nextIndex) {
        this.nextIndex = assigned + 1;
      }
      const availableIndexPos = this.availableIndexes.indexOf(assigned);
      if (availableIndexPos !== -1) {
        this.availableIndexes.splice(availableIndexPos, 1);
      }
    } else if (this.availableIndexes.length > 0) {
      this.availableIndexes.sort((a, b) => a - b);
      assigned = this.availableIndexes.shift()!;
    } else {
      assigned = this.nextIndex;
      this.nextIndex += 1;
    }

    this.assignedIndexes.set(id, assigned);
    player.setSpawnIndex(assigned);
    console.log(`Assigned spawn index ${assigned} to player ${player.getName()}`);
    return assigned;
  }

  public releaseSpawnIndex(player: GamePlayer): void {
    const id = player.getId();
    const index = this.assignedIndexes.get(id);
    if (index === undefined) return;

    this.assignedIndexes.delete(id);
    this.availableIndexes.push(index);
    console.log(`Released spawn index ${index} from player ${player.getName()}`);
  }

  public reset(): void {
    this.assignedIndexes.clear();
    this.availableIndexes = [];
    this.nextIndex = 0;
    console.log("Player spawn indexes reset");
  }

  public getSpawnIndex(player: GamePlayer): number | undefined {
    return this.assignedIndexes.get(player.getId());
  }
}
