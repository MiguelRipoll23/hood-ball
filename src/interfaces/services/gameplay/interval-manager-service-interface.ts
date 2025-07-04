import type { IIntervalService } from "./interval-service-interface.js";

export interface IIntervalManagerService {
  createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): IIntervalService;
  removeInterval(interval: IIntervalService): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}
