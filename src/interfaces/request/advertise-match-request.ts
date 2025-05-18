import type { MatchAttributes } from "../match-attributes.js";

export interface AdvertiseMatchRequest {
  version: string;
  total_slots: number;
  available_slots: number;
  attributes: MatchAttributes;
}
