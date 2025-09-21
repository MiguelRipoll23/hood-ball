export interface ITimerService {
  start(): void;
  pause(): void;
  stop(finished: boolean): void;
  hasCompleted(): boolean;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
}
