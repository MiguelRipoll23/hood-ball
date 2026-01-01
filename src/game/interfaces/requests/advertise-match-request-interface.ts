import type { MatchAttributes } from "../match-attributes-interface.js";

export interface AdvertiseMatchRequest {
  clientVersion: string;
  totalSlots: number;
  attributes: MatchAttributes;
  pingMedianMilliseconds?: number;
  usersList: string[];
}
