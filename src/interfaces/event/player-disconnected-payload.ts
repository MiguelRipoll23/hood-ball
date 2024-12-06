import { GamePlayer } from "../../models/game-player.js";

export interface PlayerDisconnectedPayload {
  player: GamePlayer;
}
