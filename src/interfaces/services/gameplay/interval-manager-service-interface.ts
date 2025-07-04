import type { IntervalService } from "../../../services/gameplay/interval-service.js";

export interface IIntervalManagerService {
  createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart?: boolean
  ): IntervalService;
  removeInterval(interval: IntervalService): void;
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  clear(): void;
  count(): number;
}
