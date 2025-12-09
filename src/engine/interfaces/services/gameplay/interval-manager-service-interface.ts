import type { IntervalServiceContract } from "./interval-service-interface.js";

export interface IntervalManagerServiceContract {
  createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): IntervalServiceContract;
  removeInterval(interval: IntervalServiceContract): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}
