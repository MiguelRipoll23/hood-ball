import { EventType } from "../enums/event-type.js";
import { GameEvent } from "../interfaces/event/game-event.js";

export type EventSubscription<T = unknown> = {
  eventType: EventType;
  eventCallback: (data: T) => void;
};

export class EventsConsumer {
  private localSubscriptions: EventSubscription[] = [];
  private remoteSubscriptions: EventSubscription[] = [];

  public subscribeToEvent<T>(
    eventType: EventType,
    eventCallback: (data: T) => void
  ) {
    this.localSubscriptions.push({
      eventType,
      eventCallback,
    } as EventSubscription);
  }

  public consumeLocalEvent<T extends GameEvent>(event: T) {
    this.localSubscriptions
      .filter((subscription) => subscription.eventType === event.getType())
      .forEach((subscription) => {
        subscription.eventCallback(event.getData());
      });
  }

  public consumeRemoteEvent<T extends GameEvent>(event: T) {
    this.remoteSubscriptions
      .filter((subscription) => subscription.eventType === event.getType())
      .forEach((subscription) => {
        subscription.eventCallback(event.getData());
      });
  }
}
