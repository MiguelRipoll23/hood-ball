import { injectable } from "@needle-di/core";
import type { GamePlayer } from "../../models/game-player.js";

@injectable()
export class PlayerSpawnService {
  // Tracks the indexes that are currently free to be used
  private availableIndexes: number[] = [];
  // Next index to assign in case there are no free ones
  private nextIndex = 0;

  public assignSpawnIndex(player: GamePlayer, index?: number): number {
    // If the player already has a spawn index, return it
    if (player.getSpawnIndex() !== -1) {
      return player.getSpawnIndex();
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

    player.setSpawnIndex(assigned);
    console.log(`Assigned spawn index ${assigned} to player ${player.getName()}`);
    return assigned;
  }

  public releaseSpawnIndex(player: GamePlayer): void {
    const index = player.getSpawnIndex();
    if (index === -1) return;

    this.availableIndexes.push(index);
    player.setSpawnIndex(-1);
    console.log(`Released spawn index ${index} from player ${player.getName()}`);
  }

  public reset(): void {
    this.availableIndexes = [];
    this.nextIndex = 0;
    console.log("Player spawn indexes reset");
  }

  public getSpawnIndex(player: GamePlayer): number | undefined {
    const index = player.getSpawnIndex();
    return index === -1 ? undefined : index;
  }
}
