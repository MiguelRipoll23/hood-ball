export interface EventConsumerServiceContract {
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
