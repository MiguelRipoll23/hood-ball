import type { MatchAttributes } from "../services/matchmaking/match-attributes.js";

export interface FindMatchesRequest {
  version: string;
  attributes: MatchAttributes;
  totalSlots: number;
}
