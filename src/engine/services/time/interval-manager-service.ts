import { IntervalService } from "./interval-service.js";
import type { IIntervalManagerService } from "../../contracts/gameplay/interval-manager-service-interface.js";
import type { IIntervalService } from "../../contracts/gameplay/interval-service-interface.js";
import { injectable } from "@needle-di/core";

@injectable()
export class IntervalManagerService implements IIntervalManagerService {
  private intervals: Set<IIntervalService> = new Set();

  public createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): IIntervalService {
    const interval = new IntervalService(durationSeconds, callback, autoStart);
    this.intervals.add(interval);
    return interval;
  }

  public removeInterval(interval: IIntervalService): void {
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



