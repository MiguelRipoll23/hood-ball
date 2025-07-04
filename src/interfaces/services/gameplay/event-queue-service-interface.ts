import type { GameEvent } from "../../events/game-event.js";

export interface IEventQueueService<T extends GameEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}
