import type { GameEvent } from "../interfaces/models/game-event-interface.ts";

export interface EventQueueServiceContract<T extends GameEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}
