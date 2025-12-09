export interface IntervalServiceContract {
  start(): void;
  restart(): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
}
