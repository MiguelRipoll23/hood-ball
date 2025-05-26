import type { MatchAttributes } from "../match-attributes.js";

export interface AdvertiseMatchRequest {
  version: string;
  totalSlots: number;
  availableSlots: number;
  attributes: MatchAttributes;
}
