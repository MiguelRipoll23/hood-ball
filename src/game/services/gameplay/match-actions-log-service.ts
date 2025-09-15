import { injectable } from "@needle-di/core";
import { MatchAction } from "../../models/match-action.js";

type MatchActionListener = (actions: MatchAction[]) => void;

@injectable()
export class MatchActionsLogService {
  private readonly maxActions = 5;
  private actions: MatchAction[] = [];
  private listeners: MatchActionListener[] = [];
  private readonly removalTimeouts = new Map<
    MatchAction,
    ReturnType<typeof setTimeout>
  >();

  public addAction(action: MatchAction): void {
    this.actions.push(action);
    this.scheduleRemoval(action);

    while (this.actions.length > this.maxActions) {
      const removedAction = this.actions.shift();
      if (removedAction) {
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

    this.actions.forEach((action) => this.cancelRemovalTimeout(action));
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

  private scheduleRemoval(action: MatchAction): void {
    const timeoutId = setTimeout(() => {
      this.removeAction(action);
    }, 3000);

    this.cancelRemovalTimeout(action);
    this.removalTimeouts.set(action, timeoutId);
  }

  private removeAction(action: MatchAction): void {
    const index = this.actions.indexOf(action);

    if (index === -1) {
      this.cancelRemovalTimeout(action);
      return;
    }

    this.actions.splice(index, 1);
    this.cancelRemovalTimeout(action);
    this.notifyListeners();
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
