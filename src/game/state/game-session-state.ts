import { Match } from "../models/match.js";
import { GamePlayer } from "../models/game-player.js";
import { GameServer } from "../models/game-server.js";
import { MatchStateType } from "../enums/match-state-type.js";
import type { GameSessionStateContract } from "../../core/models/game-state.js";

export class GameSessionState implements GameSessionStateContract {
  private readonly gameServer: GameServer = new GameServer();
  private readonly gamePlayer: GamePlayer = new GamePlayer();
  private match: Match | null = null;

  public getGameServer(): GameServer {
    return this.gameServer;
  }

  public getGamePlayer(): GamePlayer {
    return this.gamePlayer;
  }

  public getMatch(): Match | null {
    return this.match;
  }

  public setMatch(match: Match | null): void {
    if (match === null) {
      this.match = null;
      console.log("Match removed from session state");
      return;
    }

    this.match = match;

    if (match.isHost()) {
      console.log("Match created in session state", match);
    } else {
      console.log("Match set in session state", match);
    }
  }

  public setMatchState(state: MatchStateType): void {
    if (this.match === null) {
      console.warn("Cannot set state, match is null");
      return;
    }

    this.match.setState(state);
  }

  public startMatch(): void {
    this.setMatchState(MatchStateType.InProgress);
  }

  public endMatch(): void {
    this.setMatchState(MatchStateType.GameOver);
  }
}
