import { injectable } from "@needle-di/core";
import { MatchAction } from "../../models/match-action.js";

type MatchActionListener = (actions: MatchAction[]) => void;

@injectable()
export class MatchActionsLogService {
  private readonly maxActions = 5;
  private readonly defaultDisplayDurationMs = 10000; // 10 seconds when not near limit
  private readonly shortDisplayDurationMs = 3000; // 3 seconds when near limit
  private readonly fadeDurationMs = 500;
  private readonly nearLimitThreshold = 4; // Start using shorter duration at 4 actions
  private actions: MatchAction[] = [];
  private listeners: MatchActionListener[] = [];
  private readonly removalTimeouts = new Map<
    MatchAction,
    ReturnType<typeof setTimeout>
  >();
  private readonly fadeTimeouts = new Map<
    MatchAction,
    ReturnType<typeof setTimeout>
  >();

  public addAction(action: MatchAction): void {
    this.actions.push(action);
    this.scheduleFadeOut(action);
    this.scheduleRemoval(action);

    while (this.actions.length > this.maxActions) {
      const removedAction = this.actions.shift();
      if (removedAction) {
        this.cancelFadeTimeout(removedAction);
        this.cancelRemovalTimeout(removedAction);
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
      this.cancelFadeTimeout(action);
      this.cancelRemovalTimeout(action);
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
    const displayDuration = this.getDisplayDuration();
    const timeoutId = setTimeout(() => {
      action.startFadeOut(this.fadeDurationMs);
      this.fadeTimeouts.delete(action);
      this.notifyListeners();
    }, displayDuration);

    this.cancelFadeTimeout(action);
    this.fadeTimeouts.set(action, timeoutId);
  }

  private scheduleRemoval(action: MatchAction): void {
    const displayDuration = this.getDisplayDuration();
    const removalDelay = displayDuration + this.fadeDurationMs;
    const timeoutId = setTimeout(() => {
      this.removeAction(action);
    }, removalDelay);

    this.cancelRemovalTimeout(action);
    this.removalTimeouts.set(action, timeoutId);
  }

  private getDisplayDuration(): number {
    // Use shorter duration when we have 4 or more actions (approaching limit)
    return this.actions.length >= this.nearLimitThreshold
      ? this.shortDisplayDurationMs
      : this.defaultDisplayDurationMs;
  }

  private removeAction(action: MatchAction): void {
    const index = this.actions.indexOf(action);

    if (index === -1) {
      this.cancelFadeTimeout(action);
      this.cancelRemovalTimeout(action);
      return;
    }

    this.actions.splice(index, 1);
    this.cancelFadeTimeout(action);
    this.cancelRemovalTimeout(action);
    this.notifyListeners();
  }

  private cancelFadeTimeout(action: MatchAction): void {
    const timeoutId = this.fadeTimeouts.get(action);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.fadeTimeouts.delete(action);
    }
  }

  private cancelRemovalTimeout(action: MatchAction): void {
    const timeoutId = this.removalTimeouts.get(action);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.removalTimeouts.delete(action);
    }
  }

  private notifyListeners(): void {
    const snapshot = this.getActions();
    [...this.listeners].forEach((listener) => listener(snapshot));
  }
}
