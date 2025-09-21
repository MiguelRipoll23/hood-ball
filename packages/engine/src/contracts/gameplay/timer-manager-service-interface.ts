import type { ITimerService } from "./timer-service-interface.js";

export interface ITimerManagerService {
  createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): ITimerService;
  removeTimer(timer: ITimerService): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}
