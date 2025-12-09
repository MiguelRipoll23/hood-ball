import type { GameEvent } from "../interfaces/models/game-event-interface.js";

export interface EventQueueServiceContract<T extends GameEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}
