import { TimerService } from "./timer-service.ts";

export class TimerManagerService {
  private timers: Set<TimerService> = new Set();

  public createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): TimerService {
    const timer = new TimerService(durationSeconds, callback, autoStart);
    this.timers.add(timer);

    return timer;
  }

  public removeTimer(timer: TimerService): void {
    this.timers.delete(timer);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const completedTimers: TimerService[] = [];

    for (const timer of this.timers) {
      if (timer.hasCompleted()) {
        completedTimers.push(timer);
      } else {
        timer.update(deltaTimeStamp);
      }
    }

    completedTimers.forEach((timer) => this.removeTimer(timer));
  }

  public clear(): void {
    this.timers.clear();
  }

  public count(): number {
    return this.timers.size;
  }
}
