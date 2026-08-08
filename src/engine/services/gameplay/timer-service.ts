import type { TimerServiceContract } from "../../interfaces/services/gameplay/timer-service-interface.js";
import { EngineLogger } from "../engine-logger.js";

export class TimerService implements TimerServiceContract {
  private elapsedMilliseconds: number = 0;
  private durationMilliseconds: number = 0;

  private completed: boolean = false;
  private finished: boolean = false;

  private callback: () => void;

  constructor(
    durationSeconds: number,
    callback: () => void,
    private started: boolean = true
  ) {
    EngineLogger.info("Timer", `${this.constructor.name} created`, this);

    this.durationMilliseconds = durationSeconds * 1000;
    this.callback = callback;
  }

  public setDuration(durationSeconds: number): void {
    this.durationMilliseconds = durationSeconds * 1000;
    EngineLogger.info(
      "Timer",
      `${this.constructor.name} duration set to ${durationSeconds}s`,
      this
    );
  }

  public start(): void {
    this.reset();
    this.started = true;
  }

  public pause(): void {
    this.started = false;
  }

  public stop(finished: boolean): void {
    this.finished = finished;

    if (this.finished) {
      EngineLogger.info("Timer", `${this.constructor.name} finished`, this);
    } else {
      EngineLogger.info("Timer", `${this.constructor.name} stopped`, this);
    }

    this.started = false;
    this.completed = true;
  }

  public hasCompleted(): boolean {
    return this.completed;
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.started) {
      this.elapsedMilliseconds += deltaTimeStamp;

      if (this.elapsedMilliseconds >= this.durationMilliseconds) {
        this.stop(true);
        this.callback();
      }
    }
  }

  public reset(): void {
    this.elapsedMilliseconds = 0;
    this.completed = false;
    this.finished = false;
    this.started = false;

    EngineLogger.info("Timer", `${this.constructor.name} reset`, this);
  }
}
