import { Match } from "./match.js";
import { GamePlayer } from "./game-player.js";
import { GameServer } from "./game-server.js";

export class GameState {
  private gameServer: GameServer;
  private gamePlayer: GamePlayer | null = null;
  private match: Match | null = null;

  constructor() {
    this.gameServer = new GameServer();
  }

  public getGameServer(): GameServer {
    return this.gameServer;
  }

  public getGamePlayer(): GamePlayer | null {
    return this.gamePlayer;
  }

  public setGamePlayer(gamePlayer: GamePlayer): void {
    this.gamePlayer = gamePlayer;
  }

  public getMatch(): Match | null {
    return this.match;
  }

  public setMatch(match: Match | null): void {
    this.match = match;

    if (match === null) {
      return console.log("Match removed from game state");
    }

    if (match.isHost()) {
      console.log("Match created in game state", match);
    } else {
      console.log("Match set in game state", match);
    }
  }
}
