import type { MatchAttributes } from "../services/matchmaking/match-attributes.js";

export interface AdvertiseMatchRequest {
  version: string;
  totalSlots: number;
  availableSlots: number;
  attributes: MatchAttributes;
  ping_median_milliseconds?: number;
}
