import { TimerService } from "./timer-service.js";
import type { TimerManagerServiceContract } from "../../interfaces/services/gameplay/timer-manager-service-interface.js";
import type { TimerServiceContract } from "../../interfaces/services/gameplay/timer-service-interface.js";
import { injectable } from "@needle-di/core";

@injectable()
export class TimerManagerService implements TimerManagerServiceContract {
  private timers: Set<TimerServiceContract> = new Set();

  public createTimer(
    durationSeconds: number,
    callback: () => void,
    autoStart: boolean = true
  ): TimerServiceContract {
    const timer = new TimerService(durationSeconds, callback, autoStart);
    this.timers.add(timer);

    return timer;
  }

  public removeTimer(timer: TimerServiceContract): void {
    this.timers.delete(timer);
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    const completedTimers: TimerServiceContract[] = [];

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
