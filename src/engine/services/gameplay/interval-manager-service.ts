import { IntervalService } from "./interval-service.js";
import type { IntervalManagerServiceContract } from "../../interfaces/services/gameplay/interval-manager-service-interface.js";
import type { IntervalServiceContract } from "../../interfaces/services/gameplay/interval-service-interface.js";
import { injectable } from "@needle-di/core";

@injectable()
export class IntervalManagerService implements IntervalManagerServiceContract {
  private intervals: Set<IntervalServiceContract> = new Set();

  public createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): IntervalServiceContract {
    const interval = new IntervalService(durationSeconds, callback, autoStart);
    this.intervals.add(interval);
    return interval;
  }

  public removeInterval(interval: IntervalServiceContract): void {
    this.intervals.delete(interval);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    for (const interval of this.intervals) {
      interval.update(deltaTimeStamp);
    }
  }

  public clear(): void {
    this.intervals.clear();
  }

  public count(): number {
    return this.intervals.size;
  }
}
