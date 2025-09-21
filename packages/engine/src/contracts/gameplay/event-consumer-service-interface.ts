export interface IEventConsumerService {
  subscribeToLocalEvent<T>(
    eventType: number,
    eventCallback: (data: T) => void,
    log?: boolean
  ): void;
  subscribeToRemoteEvent<T>(
    eventType: number,
    eventCallback: (data: T) => void,
    log?: boolean
  ): void;
  consumeEvents(): void;
}
