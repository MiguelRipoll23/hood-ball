import { EventType } from "../enums/event-type.js";
import { EventQueueService } from "./event-queue-service.js";
import type { EventSubscription } from "../types/event-subscription.js";
import { GameController } from "../models/game-controller.js";
import { LocalEvent } from "../models/local-event.js";
import { RemoteEvent } from "../models/remote-event.js";
import { EventProcessorService } from "./event-processor-service.js";

export class EventConsumerService {
  private eventProcessorService: EventProcessorService;

  private localQueue: EventQueueService<LocalEvent>;
  private remoteQueue: EventQueueService<RemoteEvent>;

  private localSubscriptions: EventSubscription[] = [];
  private remoteSubscriptions: EventSubscription[] = [];

  constructor(gameController: GameController) {
    this.eventProcessorService = gameController.getEventProcessorService();
    this.localQueue = gameController.getEventProcessorService().getLocalQueue();
    this.remoteQueue = gameController
      .getEventProcessorService()
      .getRemoteQueue();
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
        this.eventProcessorService.setLastConsumedEvent(event.getType());
      });
  }

  private consumeRemoteEvent(event: RemoteEvent) {
    this.remoteSubscriptions
      .filter((subscription) => subscription.eventType === event.getType())
      .forEach((subscription) => {
        subscription.eventCallback(event.getData());
        this.remoteQueue.consumeEvent(event);
        this.eventProcessorService.setLastConsumedEvent(event.getType());
      });
  }
}
