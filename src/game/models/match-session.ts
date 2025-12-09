import type { MatchAttributes } from "../interfaces/match-attributes-interface.js";
import { MatchStateType } from "../enums/match-state-type.js";
import { GamePlayer } from "./game-player.js";

export class MatchSession {
  private host: boolean;
  private state: MatchStateType;
  private totalSlots: number;
  private attributes: MatchAttributes;

  private players: Map<string, GamePlayer>;
  private pingMedianMilliseconds: number | null;

  constructor(
    host: boolean,
    state: MatchStateType,
    totalSlots: number,
    attributes: MatchAttributes
  ) {
    this.host = host;
    this.state = state;
    this.totalSlots = totalSlots;
    this.attributes = attributes;
    this.players = new Map();
    this.pingMedianMilliseconds = null;
  }

  public isHost(): boolean {
    return this.host;
  }

  public getState(): MatchStateType {
    return this.state;
  }

  public setState(state: MatchStateType): void {
    this.state = state;
    console.log("Match state changed to", MatchStateType[state]);
  }

  public getTotalSlots(): number {
    return this.totalSlots;
  }

  public getAvailableSlots(): number {
    return this.totalSlots - this.players.size;
  }

  public getAttributes(): MatchAttributes {
    return this.attributes;
  }

  public getPlayers(): GamePlayer[] {
    return Array.from(this.players.values());
  }

  public getPingMedianMilliseconds(): number | null {
    return this.pingMedianMilliseconds;
  }

  public setPingMedianMilliseconds(ping: number | null): void {
    this.pingMedianMilliseconds = ping;
  }

  public getPlayerByNetworkId(networkId: string): GamePlayer | null {
    return this.players.get(networkId) ?? null;
  }

  public addPlayer(player: GamePlayer): void {
    this.players.set(player.getNetworkId(), player);

    console.log(
      `Added player ${player.getName()} to match, total players`,
      this.players.size
    );
  }

  public removePlayer(player: GamePlayer): void {
    this.players.delete(player.getNetworkId());

    console.log(
      `Removed player ${player.getName()} from match, total players`,
      this.players.size
    );
  }

  public removePlayerByNetworkId(networkId: string): void {
    this.players.delete(networkId);

    console.log(
      `Removed player ${networkId} from match, total players`,
      this.players.size
    );
  }

  public getHost(): GamePlayer | null {
    for (const player of this.players.values()) {
      if (player.isHost()) {
        return player;
      }
    }

    return null;
  }
}
