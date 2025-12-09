import { UUIDUtils } from "../utils/uuid-utils.ts";
import type { Player } from "../../engine/interfaces/models/player-interface.ts";

export class GamePlayer implements Player {
  private id: string;
  private networkId: string;
  private name: string;
  private host: boolean;
  private score: number;
  private spawnPointIndex: number;

  private pingTime: number | null = null;

  constructor(
    id = "00000000-0000-0000-0000-000000000000",
    name = "Unknown",
    host = false,
    score = 0,
    spawnIndex = 0
  ) {
    this.id = this.getNormalizedId(id);
    this.networkId = id.replaceAll("-", "");
    this.name = name;
    this.score = score;
    this.host = host;
    this.spawnPointIndex = spawnIndex;
  }

  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
    this.networkId = id.replaceAll("-", "");
  }

  public getNetworkId(): string {
    return this.networkId;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public isHost(): boolean {
    return this.host;
  }

  public setHost(host: boolean): void {
    this.host = host;
  }

  public getScore(): number {
    return this.score;
  }

  public sumScore(score: number): void {
    this.score += score;
  }

  public setScore(score: number): void {
    this.score = score;
  }

  public getSpawnPointIndex(): number {
    return this.spawnPointIndex;
  }

  public setSpawnPointIndex(spawnPointIndex: number): void {
    this.spawnPointIndex = spawnPointIndex;
  }

  public getPingTime(): number | null {
    return this.pingTime;
  }

  public setPingTime(pingTime: number | null): void {
    this.pingTime = pingTime;
  }

  public reset(): void {
    this.host = false;
    this.pingTime = null;
    this.score = 0;
    this.spawnPointIndex = 0;

    console.log("Player with name", this.name + " has been reset");
  }

  private getNormalizedId(id: string): string {
    if (id.includes("-")) {
      return id;
    }

    return UUIDUtils.format(id);
  }
}
