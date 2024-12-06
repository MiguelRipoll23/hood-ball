import { Match } from "./match.js";
import { GamePlayer } from "./game-player.js";
import { GameServer } from "./game-server.js";

export class GameState {
  private gamePlayer: GamePlayer;
  private gameServer: GameServer;
  private match: Match | null = null;

  constructor() {
    this.gamePlayer = new GamePlayer();
    this.gameServer = new GameServer();
  }

  public getGamePlayer(): GamePlayer {
    return this.gamePlayer;
  }

  public getGameServer(): GameServer {
    return this.gameServer;
  }

  public getMatch(): Match | null {
    return this.match;
  }

  public setMatch(match: Match | null): void {
    this.match = match;

    if (match === null) {
      return console.log("Match deleted");
    }

    if (match.isHost()) {
      console.log("Match created", match);
    } else {
      console.log("Match set", match);
    }
  }
}
