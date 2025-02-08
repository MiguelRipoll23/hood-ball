import { EventsConsumer } from "./events-consumer-service.js";
import { EventsQueue } from "../models/events-queue.js";
import { RemoteEvent } from "../models/remote-event.js";

export class RemoteEventsQueueService extends EventsQueue<RemoteEvent> {
  public consumeEvents(eventsConsumer: EventsConsumer) {
    this.events.forEach((event) => {
      eventsConsumer.consumeRemoteEvent(event);
    });
  }
}
