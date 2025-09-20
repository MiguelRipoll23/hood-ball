import { inject, injectable } from "@needle-di/core";
import { MatchAction } from "../../models/match-action.js";
import { TimerManagerService } from "../../../engine/services/time/timer-manager-service.js";
import type { ITimerService } from "../../../engine/contracts/gameplay/timer-service-interface.js";

type MatchActionListener = (actions: MatchAction[]) => void;

@injectable()
export class MatchActionsLogService {
  private readonly maxActions = 5;
  private readonly displayDurationMs = 3000;
  private readonly fadeDurationMs = 500;
  private readonly removalDelayMs = this.displayDurationMs + this.fadeDurationMs;

  private readonly fadeTimers = new Map<MatchAction, ITimerService>();
  private readonly removalTimers = new Map<MatchAction, ITimerService>();

  private actions: MatchAction[] = [];
  private listeners: MatchActionListener[] = [];

  constructor(
    private readonly timerManager = inject(TimerManagerService)
  ) {}

  public addAction(action: MatchAction): void {
    this.actions.push(action);
    this.scheduleFadeOut(action);
    this.scheduleRemoval(action);

    while (this.actions.length > this.maxActions) {
      const removedAction = this.actions.shift();
      if (removedAction) {
        this.cancelFadeTimer(removedAction);
        this.cancelRemovalTimer(removedAction);
      }
    }

    this.notifyListeners();
  }

  public getActions(): MatchAction[] {
    return [...this.actions];
  }

  public clear(): void {
    if (this.actions.length === 0) {
      return;
    }

    this.actions.forEach((action) => {
      this.cancelFadeTimer(action);
      this.cancelRemovalTimer(action);
    });
    this.actions.length = 0;
    this.notifyListeners();
  }

  public onChange(listener: MatchActionListener): () => void {
    this.listeners.push(listener);
    listener(this.getActions());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private scheduleFadeOut(action: MatchAction): void {
    this.cancelFadeTimer(action);

    const timer = this.timerManager.createTimer(
      this.displayDurationMs / 1000,
      () => {
        action.startFadeOut(this.fadeDurationMs);
        this.fadeTimers.delete(action);
        this.notifyListeners();
      }
    );

    this.fadeTimers.set(action, timer);
  }

  private scheduleRemoval(action: MatchAction): void {
    this.cancelRemovalTimer(action);

    const timer = this.timerManager.createTimer(
      this.removalDelayMs / 1000,
      () => {
        this.removalTimers.delete(action);
        this.removeAction(action);
      }
    );

    this.removalTimers.set(action, timer);
  }

  private removeAction(action: MatchAction): void {
    const index = this.actions.indexOf(action);

    if (index === -1) {
      this.cancelFadeTimer(action);
      this.cancelRemovalTimer(action);
      return;
    }

    this.actions.splice(index, 1);
    this.cancelFadeTimer(action);
    this.cancelRemovalTimer(action);
    this.notifyListeners();
  }

  private cancelFadeTimer(action: MatchAction): void {
    const timer = this.fadeTimers.get(action);
    if (!timer) {
      return;
    }

    if (!timer.hasCompleted()) {
      timer.stop(false);
    }

    this.timerManager.removeTimer(timer);
    this.fadeTimers.delete(action);
  }

  private cancelRemovalTimer(action: MatchAction): void {
    const timer = this.removalTimers.get(action);
    if (!timer) {
      return;
    }

    if (!timer.hasCompleted()) {
      timer.stop(false);
    }

    this.timerManager.removeTimer(timer);
    this.removalTimers.delete(action);
  }

  private notifyListeners(): void {
    const snapshot = this.getActions();
    [...this.listeners].forEach((listener) => listener(snapshot));
  }
}
