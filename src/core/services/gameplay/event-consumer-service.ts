import { EventType } from "../../../game/enums/event-type.js";
import type { IEventQueueService } from "../../interfaces/services/gameplay/event-queue-service-interface.js";
import type { EventSubscription } from "../../../game/types/event-subscription.js";
import { LocalEvent } from "../../models/local-event.js";
import { RemoteEvent } from "../../models/remote-event.js";
import { EventProcessorService } from "./event-processor-service.js";
import { container } from "../di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class EventConsumerService {
  private localQueue: IEventQueueService<LocalEvent>;
  private remoteQueue: IEventQueueService<RemoteEvent>;

  private localSubscriptions: EventSubscription[] = [];
  private remoteSubscriptions: EventSubscription[] = [];

  constructor() {
    const eventProcessorService = container.get(EventProcessorService);
    this.localQueue = eventProcessorService.getLocalQueue();
    this.remoteQueue = eventProcessorService.getRemoteQueue();
  }

  public subscribeToLocalEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void,
    log = false
  ) {
    this.localSubscriptions.push({
      eventType,
      eventCallback,
    } as EventSubscription);

    if (log) {
      console.log(`Subscribed to local event ${EventType[eventType]}`);
    }
  }

  public subscribeToRemoteEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void,
    log = false
  ) {
    this.remoteSubscriptions.push({
      eventType,
      eventCallback,
    } as EventSubscription);

    if (log) {
      console.log(`Subscribed to remote event ${EventType[eventType]}`);
    }
  }

  public consumeEvents() {
    this.localQueue
      .getPendingEvents()
      .forEach((event) => this.consumeLocalEvent.bind(this)(event));

    this.remoteQueue
      .getPendingEvents()
      .forEach((event) => this.consumeRemoteEvent.bind(this)(event));
  }

  private consumeLocalEvent(event: LocalEvent) {
    this.localSubscriptions
      .filter((subscription) => subscription.eventType === event.getType())
      .forEach((subscription) => {
        subscription.eventCallback(event.getData());
        this.localQueue.consumeEvent(event);
      });
  }

  private consumeRemoteEvent(event: RemoteEvent) {
    this.remoteSubscriptions
      .filter((subscription) => subscription.eventType === event.getType())
      .forEach((subscription) => {
        subscription.eventCallback(event.getData());
        this.remoteQueue.consumeEvent(event);
      });
  }
}
