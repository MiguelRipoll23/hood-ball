import type { MatchAttributes } from "../interfaces/match-attributes.js";
import { MatchStateType } from "../enums/match-state-type.js";
import { GamePlayer } from "./game-player.js";

export class Match {
  private host: boolean;
  private state: MatchStateType;
  private totalSlots: number;
  private attributes: MatchAttributes;

  private players: Map<string, GamePlayer>;

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

  public getPlayer(id: string): GamePlayer | null {
    return this.players.get(id) ?? null;
  }

  public addPlayer(player: GamePlayer): void {
    this.players.set(player.getId(), player);

    console.log(
      `Added player ${player.getName()} to match, total players`,
      this.players.size
    );
  }

  public removePlayer(player: GamePlayer): void {
    this.players.delete(player.getId());

    console.log(
      `Removed player ${player.getName()} from match, total players`,
      this.players.size
    );
  }

  public removePlayerById(id: string): void {
    this.players.delete(id);

    console.log(
      `Removed player ${id} from match, total players`,
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
