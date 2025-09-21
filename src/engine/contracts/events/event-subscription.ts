import type { EngineEventId } from "./event-identifier.js";

export interface EngineEventSubscription<T = unknown> {
  eventType: EngineEventId;
  eventCallback: (data: T) => void;
}
