import { IntervalService } from "./interval-service.js";

export class IntervalManagerService {
  private intervals: Set<IntervalService> = new Set();

  public createInterval(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): IntervalService {
    const interval = new IntervalService(durationSeconds, callback, autoStart);
    this.intervals.add(interval);
    return interval;
  }

  public removeInterval(interval: IntervalService): void {
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
