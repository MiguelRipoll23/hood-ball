import type { GameEvent } from "../../interfaces/models/game-event-interface.js";
import type { EventQueueServiceContract } from "../../interfaces/services/events/event-queue-service-contract.js";

export class EventQueueService<T extends GameEvent>
  implements EventQueueServiceContract<T>
{
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
      this.checkAndRemoveConsumedEvents();
    }
  }

  private checkAndRemoveConsumedEvents() {
    const consumedCount = this.events.filter((event) =>
      event.isConsumed()
    ).length;

    if (consumedCount > EventQueueService.MAX_CONSUMED_EVENTS) {
      this.removeConsumedEvents();
    }
  }

  private removeConsumedEvents() {
    this.events = this.events.filter((event) => !event.isConsumed());
    console.log(`Cleaned up consumed events. Remaining: ${this.events.length}`);
  }
}
