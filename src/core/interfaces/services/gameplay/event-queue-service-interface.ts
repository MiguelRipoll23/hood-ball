import type { GameEvent } from "../../models/game-event.js";

export interface IEventQueueService<T extends GameEvent> {
  getEvents(): T[];
  getPendingEvents(): T[];
  addEvent(event: T): void;
  consumeEvent(event: T): void;
}
