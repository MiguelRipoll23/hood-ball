import type { EventQueueServiceContract } from "../../contracts/gameplay/event-queue-service-interface.js";
import type { EngineEventSubscription } from "../../contracts/events/event-subscription.js";
import type { EngineEventId, EventIdentifierResolver } from "../../contracts/events/event-identifier.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN } from "../../contracts/events/event-identifier.js";
import { LocalEvent } from "../../../core/models/local-event.js";
import { RemoteEvent } from "../../../core/models/remote-event.js";
import { EventProcessorService } from "./event-processor-service.js";
import { inject, injectable } from "@needle-di/core";

@injectable()
export class EventConsumerService {
  private readonly localQueue: EventQueueServiceContract<LocalEvent>;
  private readonly remoteQueue: EventQueueServiceContract<RemoteEvent>;

  private localSubscriptions: EngineEventSubscription[] = [];
  private remoteSubscriptions: EngineEventSubscription[] = [];
  private readonly eventNameResolver: EventIdentifierResolver | undefined;

  constructor(
    private readonly eventProcessorService: EventProcessorService = inject(EventProcessorService)
  ) {
    this.localQueue = this.eventProcessorService.getLocalQueue();
    this.remoteQueue = this.eventProcessorService.getRemoteQueue();
    this.eventNameResolver = inject(EVENT_IDENTIFIER_RESOLVER_TOKEN, { optional: true }) as EventIdentifierResolver | undefined;
  }

  public subscribeToLocalEvent<T>(
    eventType: EngineEventId,
    eventCallback: (data: T) => void,
    log = false
  ): EngineEventSubscription {
    const subscription = { eventType, eventCallback } as EngineEventSubscription;
    this.localSubscriptions.push(subscription);

    if (log) {
      console.log(`Subscribed to local event ${this.describeEvent(eventType)}`);
    }

    return subscription;
  }

  public unsubscribeFromLocalEvent(subscription: EngineEventSubscription): void {
    const index = this.localSubscriptions.indexOf(subscription);
    if (index !== -1) {
      this.localSubscriptions.splice(index, 1);
    }
  }

  public subscribeToRemoteEvent<T>(
    eventType: EngineEventId,
    eventCallback: (data: T) => void,
    log = false
  ): EngineEventSubscription {
    const subscription = { eventType, eventCallback } as EngineEventSubscription;
    this.remoteSubscriptions.push(subscription);

    if (log) {
      console.log(`Subscribed to remote event ${this.describeEvent(eventType)}`);
    }

    return subscription;
  }

  public unsubscribeFromRemoteEvent(subscription: EngineEventSubscription): void {
    const index = this.remoteSubscriptions.indexOf(subscription);
    if (index !== -1) {
      this.remoteSubscriptions.splice(index, 1);
    }
  }

  public consumeEvents() {
    this.localQueue
      .getPendingEvents()
      .forEach((event) => this.consumeLocalEvent(event));

    this.remoteQueue
      .getPendingEvents()
      .forEach((event) => this.consumeRemoteEvent(event));
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
  private describeEvent(eventType: EngineEventId): string {
    return (
      this.eventNameResolver?.getName(eventType) ?? `Event(${eventType})`
    );
  }
}
