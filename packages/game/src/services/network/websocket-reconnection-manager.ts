import { injectable } from "@needle-di/core";

export type ReconnectionConfig = {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
};

@injectable()
export class WebSocketReconnectionManager {
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxAttempts: number;

  private active = false;
  private attempts = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(config: ReconnectionConfig = {}) {
    this.baseDelayMs = config.baseDelayMs ?? 1000;
    this.maxDelayMs = config.maxDelayMs ?? 30000;
    this.maxAttempts = config.maxAttempts ?? 50;
  }

  public start(schedule: () => void): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.attempts = 0;
    this.scheduleNext(schedule);
  }

  public stop(): void {
    this.active = false;
    this.attempts = 0;

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public scheduleNext(callback: () => void): void {
    if (!this.active) {
      return;
    }

    if (this.maxAttempts > 0 && this.attempts >= this.maxAttempts) {
      console.log(
        `Maximum reconnection attempts (${this.maxAttempts}) reached. Stopping reconnection.`
      );
      this.stop();
      return;
    }

    const delay = this.computeDelay();
    this.attempts += 1;

    console.log(`Scheduling reconnection attempt ${this.attempts} in ${delay}ms`);

    this.timeoutId = setTimeout(() => {
      if (!this.active) {
        return;
      }

      console.log(`Reconnection attempt ${this.attempts}`);
      callback();
    }, delay);
  }

  private computeDelay(): number {
    const exponentialDelay = this.baseDelayMs * Math.pow(2, this.attempts);
    return Math.min(exponentialDelay, this.maxDelayMs);
  }
}
