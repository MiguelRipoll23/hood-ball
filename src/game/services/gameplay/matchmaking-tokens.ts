import { InjectionToken } from "@needle-di/core";

export const PendingIdentitiesToken = new InjectionToken("PendingIdentities");

export const ReceivedIdentitiesToken = new InjectionToken("ReceivedIdentities");

export const PendingDisconnectionsToken = new InjectionToken(
  "PendingDisconnections"
);
