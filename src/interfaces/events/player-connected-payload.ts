import { GamePlayer } from "../../models/game-player.js";

export interface PlayerConnectedPayload {
  player: GamePlayer;
  matchmaking: boolean;
}
