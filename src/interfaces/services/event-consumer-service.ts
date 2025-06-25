import type { EventType } from "../../enums/event-type.js";

export interface IEventConsumerService {
  subscribeToLocalEvent<T>(eventType: EventType, callback: (data: T) => void, log?: boolean): void;
  subscribeToRemoteEvent<T>(eventType: EventType, callback: (data: T) => void, log?: boolean): void;
  consumeEvents(): void;
}
