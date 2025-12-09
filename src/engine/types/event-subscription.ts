import { EventType } from "../enums/event-type.ts";

export type EventSubscription<T = unknown> = {
  eventType: EventType;
  eventCallback: (data: T) => void;
};
