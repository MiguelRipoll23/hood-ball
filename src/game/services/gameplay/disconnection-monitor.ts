import { inject, injectable } from "@needle-di/core";
import type { ITimerService } from "../../../core/interfaces/services/gameplay/timer-service-interface.js";
import { TimerManagerService } from "../../../core/services/gameplay/timer-manager-service.js";

@injectable()
export class DisconnectionMonitor {
  private readonly pending = new Set<string>();
  private timeout: ITimerService | null = null;

  constructor(
    private readonly timerManager = inject(TimerManagerService)
  ) {}

  public track(playerIds: string[], onTimeout: () => void): void {
    this.clear();
    playerIds.forEach((id) => this.pending.add(id));
    this.timeout = this.timerManager.createTimer(3, () => {
      this.clear();
      onTimeout();
    });
  }

  public markDisconnected(playerId: string, onEmpty: () => void): void {
    this.pending.delete(playerId);
    if (this.pending.size === 0) {
      this.timeout?.stop(false);
      onEmpty();
    }
  }

  public clear(): void {
    this.timeout?.stop(false);
    this.pending.clear();
  }

  public isTracking(): boolean {
    return this.pending.size > 0;
  }
}
