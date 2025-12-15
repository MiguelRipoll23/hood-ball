import { EventType } from "../../game/enums/event-type.js";

export type EventSubscription<T = unknown> = {
  eventType: EventType;
  eventCallback: (data: T) => void;
};
