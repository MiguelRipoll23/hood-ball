import { TimerService } from "./timer-service.js";
import type { ITimerManagerService } from "../../contracts/gameplay/timer-manager-service-interface.js";
import type { ITimerService } from "../../contracts/gameplay/timer-service-interface.js";
import { injectable } from "@needle-di/core";

@injectable()
export class TimerManagerService implements ITimerManagerService {
  private timers: Set<ITimerService> = new Set();

  public createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): ITimerService {
    const timer = new TimerService(durationSeconds, callback, autoStart);
    this.timers.add(timer);

    return timer;
  }

  public removeTimer(timer: ITimerService): void {
    this.timers.delete(timer);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const completedTimers: ITimerService[] = [];

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



