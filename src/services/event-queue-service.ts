import type { GameEvent } from "../interfaces/events/game-event.js";

export class EventQueueService<T extends GameEvent> {
  protected events: T[] = [];

  public getEvents(): T[] {
    return this.events;
  }

  public getPendingEvents(): T[] {
    return this.events.filter((event) => event.isConsumed() === false);
  }

  public addEvent(event: T) {
    this.events.push(event);
  }

  public consumeEvent(event: T) {
    const foundEvent = this.events.find((e) => e === event);

    if (foundEvent) {
      foundEvent.consume();
    }
  }
}
