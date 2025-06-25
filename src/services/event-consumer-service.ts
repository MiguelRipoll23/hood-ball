import { EventType } from "../enums/event-type.js";
import { EventQueueService } from "./event-queue-service.js";
import type { EventSubscription } from "../types/event-subscription.js";
import { LocalEvent } from "../models/local-event.js";
import { RemoteEvent } from "../models/remote-event.js";
import { EventProcessorService } from "./event-processor-service.js";
import type { IEventProcessorService } from "../interfaces/services/event-processor-service.js";
import { ServiceLocator } from "./service-locator.js";
import type { IEventBusService } from "../interfaces/services/event-bus-service.js";
import { EventBusService } from "./event-bus-service.js";
import type { IEventConsumerService } from "../interfaces/services/event-consumer-service.js";

export class EventConsumerService implements IEventConsumerService {
  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;

  private localSubscriptions: EventSubscription[] = [];
  private remoteSubscriptions: EventSubscription[] = [];

  constructor(
    eventBus: IEventBusService = ServiceLocator.get(EventBusService)
  ) {
    const eventProcessorService = ServiceLocator.get<IEventProcessorService>(EventProcessorService);
    this.localQueue = eventProcessorService.getLocalQueue();
    this.remoteQueue = eventProcessorService.getRemoteQueue();
    eventBus.on("localEvent", (e) => this.localQueue.addEvent(e as LocalEvent));
    eventBus.on("remoteEvent", (e) => this.remoteQueue.addEvent(e as RemoteEvent));
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
