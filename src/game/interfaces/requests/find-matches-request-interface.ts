import type { MatchAttributes } from "../match-attributes-interface.js";

export interface FindMatchesRequest {
  clientVersion: string;
  attributes: MatchAttributes;
  totalSlots: number;
}
