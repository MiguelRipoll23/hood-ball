import { EventType } from "../../enums/event-type.ts";
import type { EventQueueServiceContract } from "../../contracts/event-queue-service-contract.ts";
import type { EventSubscription } from "../../types/event-subscription.ts";
import { LocalEvent } from "../../models/local-event.ts";
import { RemoteEvent } from "../../models/remote-event.ts";
import { EventProcessorService } from "./event-processor-service.ts";
import { injectable, inject } from "@needle-di/core";

@injectable()
export class EventConsumerService {
  private localQueue: EventQueueServiceContract<LocalEvent>;
  private remoteQueue: EventQueueServiceContract<RemoteEvent>;

  private localSubscriptions: EventSubscription[] = [];
  private remoteSubscriptions: EventSubscription[] = [];

  constructor(
    eventProcessorService: EventProcessorService = inject(
      EventProcessorService
    )
  ) {
    this.localQueue = eventProcessorService.getLocalQueue();
    this.remoteQueue = eventProcessorService.getRemoteQueue();
  }

  public subscribeToLocalEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void,
    log = false
  ): EventSubscription {
    const subscription = { eventType, eventCallback } as EventSubscription;
    this.localSubscriptions.push(subscription);

    if (log) {
      console.log(`Subscribed to local event ${EventType[eventType]}`);
    }

    return subscription;
  }

  public unsubscribeFromLocalEvent(subscription: EventSubscription): void {
    const index = this.localSubscriptions.indexOf(subscription);
    if (index !== -1) {
      this.localSubscriptions.splice(index, 1);
    }
  }

  public subscribeToRemoteEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void,
    log = false
  ): EventSubscription {
    const subscription = { eventType, eventCallback } as EventSubscription;
    this.remoteSubscriptions.push(subscription);

    if (log) {
      console.log(`Subscribed to remote event ${EventType[eventType]}`);
    }

    return subscription;
  }

  public unsubscribeFromRemoteEvent(subscription: EventSubscription): void {
    const index = this.remoteSubscriptions.indexOf(subscription);
    if (index !== -1) {
      this.remoteSubscriptions.splice(index, 1);
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
