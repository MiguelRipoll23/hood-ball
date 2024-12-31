export class IntervalService {
  private elapsedMilliseconds: number = 0;
  private durationMilliseconds: number = 0;

  private callback: () => void;

  constructor(
    durationSeconds: number,
    callback: () => void,
    private started: boolean = true
  ) {
    console.log(`${this.constructor.name} created`, this);

    this.durationMilliseconds = durationSeconds * 1000;
    this.callback = callback;
  }

  public start(): void {
    this.started = true;
  }

  public restart(): void {
    this.elapsedMilliseconds = 0;
    this.start();
  }

  public update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.started) {
      this.elapsedMilliseconds += deltaTimeStamp;

      if (this.elapsedMilliseconds >= this.durationMilliseconds) {
        this.callback();
        this.restart();
      }
    }
  }
}
