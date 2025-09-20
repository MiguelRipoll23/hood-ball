import { Match } from "../../game/models/match.js";
import { GamePlayer } from "../../game/models/game-player.js";
import { GameServer } from "../../game/models/game-server.js";
import { MatchStateType } from "../../game/enums/match-state-type.js";
import { EngineState } from "../../engine/state/engine-state.js";

export interface GameSessionStateContract {
  getGameServer(): GameServer;
  getGamePlayer(): GamePlayer;
  getMatch(): Match | null;
  setMatch(match: Match | null): void;
  setMatchState(state: MatchStateType): void;
  startMatch(): void;
  endMatch(): void;
}

export class GameState extends EngineState {
  constructor(
    canvas: HTMLCanvasElement,
    debugging: boolean,
    private readonly sessionState: GameSessionStateContract
  ) {
    super(canvas, debugging);
  }

  public getSessionState(): GameSessionStateContract {
    return this.sessionState;
  }

  public getGameServer(): GameServer {
    return this.sessionState.getGameServer();
  }

  public getGamePlayer(): GamePlayer {
    return this.sessionState.getGamePlayer();
  }

  public getMatch(): Match | null {
    return this.sessionState.getMatch();
  }

  public setMatch(match: Match | null): void {
    this.sessionState.setMatch(match);
  }

  public setMatchState(state: MatchStateType): void {
    this.sessionState.setMatchState(state);
  }

  public startMatch(): void {
    this.sessionState.startMatch();
  }

  public endMatch(): void {
    this.sessionState.endMatch();
  }
}
