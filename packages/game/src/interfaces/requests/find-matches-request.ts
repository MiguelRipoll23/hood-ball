import type { MatchAttributes } from "../services/matchmaking/match-attributes.js";

export interface FindMatchesRequest {
  clientVersion: string;
  attributes: MatchAttributes;
  totalSlots: number;
}
