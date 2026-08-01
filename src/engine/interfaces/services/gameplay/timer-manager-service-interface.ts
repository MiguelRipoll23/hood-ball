import { InjectionToken } from "@needle-di/core";
import type { TimerServiceContract } from "./timer-service-interface.js";

export interface TimerManagerServiceContract {
  createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): TimerServiceContract;
  removeTimer(timer: TimerServiceContract): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}

export const TIMER_MANAGER_SERVICE_TOKEN =
  new InjectionToken<TimerManagerServiceContract>(
    "TimerManagerServiceContract"
  );
