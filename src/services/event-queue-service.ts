import type { GameEvent } from "../interfaces/events/game-event.js";

export class EventQueueService<T extends GameEvent> {
  private static readonly MAX_CONSUMED_EVENTS = 50;

  protected events: T[] = [];

  public getEvents(): T[] {
    return this.events;
  }

  public getPendingEvents(): T[] {
    return this.events.filter((event) => !event.isConsumed());
  }

  public addEvent(event: T) {
    this.events.push(event);
  }

  public consumeEvent(event: T) {
    const foundEvent = this.events.find((e) => e === event);

    if (foundEvent) {
      foundEvent.consume();
    }

    if (this.events.length > EventQueueService.MAX_CONSUMED_EVENTS) {
      this.cleanupConsumedEvents();
    }
  }

  protected cleanupConsumedEvents() {
    this.events = this.events.filter((event) => !event.isConsumed());
  }
}
