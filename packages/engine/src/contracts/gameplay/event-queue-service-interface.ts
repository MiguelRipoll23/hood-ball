import type { EngineEvent } from "@engine/models/engine-event.js";

export interface EventQueueServiceContract<T extends EngineEvent = EngineEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}

