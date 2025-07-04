import type { TimerService } from "../../../services/gameplay/timer-service.js";

export interface ITimerManagerService {
  createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): TimerService;
  removeTimer(timer: TimerService): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}
