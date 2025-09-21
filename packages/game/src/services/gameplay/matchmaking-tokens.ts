import { InjectionToken } from "@needle-di/core";

export type PendingIdentityMap = Map<string, boolean>;

export interface ReceivedIdentityRecord {
  playerId: string;
  playerName: string;
}

export type ReceivedIdentityMap = Map<string, ReceivedIdentityRecord>;

export const PendingIdentitiesToken = new InjectionToken("PendingIdentities");

export const ReceivedIdentitiesToken = new InjectionToken(
  "ReceivedIdentities"
);
