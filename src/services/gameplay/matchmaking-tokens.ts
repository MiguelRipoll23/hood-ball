import { InjectionToken } from "@needle-di/core";

export const PendingIdentitiesToken = new InjectionToken<Map<string, boolean>>(
  "PendingIdentities"
);

export const ReceivedIdentitiesToken = new InjectionToken<
  Map<string, { playerId: string; playerName: string }>
>("ReceivedIdentities");
