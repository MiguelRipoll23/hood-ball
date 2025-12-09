import type { MatchAttributes } from "../match-attributes-interface.js";

export interface AdvertiseMatchRequest {
  version: string;
  totalSlots: number;
  availableSlots: number;
  attributes: MatchAttributes;
  pingMedianMilliseconds?: number;
}
