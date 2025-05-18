import type { MatchAttributes } from "../match-attributes.js";

export interface FindMatchesRequest {
  version: string;
  attributes: MatchAttributes;
  total_slots: number;
}
