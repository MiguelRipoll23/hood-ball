export class TimerService {
  private elapsedMilliseconds: number = 0;
  private durationMilliseconds: number = 0;

  private completed: boolean = false;
  private finished: boolean = false;

  private callback: () => void;

  started: boolean;

  constructor(
    durationSeconds: number,
    callback: () => void,
    started: boolean = true
  ) {
    console.log(`${this.constructor.name} created`, this);

    this.durationMilliseconds = durationSeconds * 1000;
    this.callback = callback;
    this.started = started;
  }

  public start(): void {
    this.started = true;
  }

  public pause(): void {
    this.started = false;
  }

  public stop(finished: boolean): void {
    this.finished = finished;

    if (this.finished) {
      console.log(`${this.constructor.name} finished`, this);
    } else {
      console.log(`${this.constructor.name} stopped`, this);
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
}
