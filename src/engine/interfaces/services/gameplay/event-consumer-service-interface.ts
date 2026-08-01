import { InjectionToken } from "@needle-di/core";
import type { EventSubscription } from "../../../types/event-subscription.js";

export interface EventConsumerServiceContract {
  subscribeToLocalEvent<T>(
    eventType: number,
    eventCallback: (data: T) => void,
    log?: boolean
  ): EventSubscription;
  subscribeToRemoteEvent<T>(
    eventType: number,
    eventCallback: (data: T) => void,
    log?: boolean
  ): EventSubscription;
  unsubscribeFromLocalEvent(subscription: EventSubscription): void;
  unsubscribeFromRemoteEvent(subscription: EventSubscription): void;
  consumeEvents(): void;
}

export const EVENT_CONSUMER_SERVICE_TOKEN =
  new InjectionToken<EventConsumerServiceContract>(
    "EventConsumerServiceContract"
  );
