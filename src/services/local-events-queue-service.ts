import { EventsConsumer } from "./events-consumer-service.js";
import { EventsQueue } from "../models/events-queue.js";
import { LocalEvent } from "../models/local-event.js";

export class LocalEventsQueueService extends EventsQueue<LocalEvent> {
  public consumeEvents(eventsConsumer: EventsConsumer) {
    this.events.forEach((event) => {
      eventsConsumer.consumeLocalEvent(event);
    });
  }
}
