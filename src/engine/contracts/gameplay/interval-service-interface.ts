export interface IIntervalService {
  start(): void;
  restart(): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
}
