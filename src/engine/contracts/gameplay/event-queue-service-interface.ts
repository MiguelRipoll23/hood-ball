import type { GameEvent } from "../../../core/interfaces/models/game-event.js";

export interface EventQueueServiceContract<T extends GameEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}
