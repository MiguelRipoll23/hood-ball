import { InjectionToken } from "@needle-di/core";

export type EngineEventId = number;

export interface EventIdentifierResolver {
  getName(eventId: EngineEventId): string | null;
}

export const EVENT_IDENTIFIER_RESOLVER_TOKEN = new InjectionToken(
  "EventIdentifierResolver"
);
